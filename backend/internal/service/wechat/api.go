package wechatsvc

import (
	"context"
	"crypto/rand"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"quick_message/backend/internal/models"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type accessTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
	ErrCode     int64  `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
}

type jsapiTicketResponse struct {
	Ticket    string `json:"ticket"`
	ExpiresIn int64  `json:"expires_in"`
	ErrCode   int64  `json:"errcode"`
	ErrMsg    string `json:"errmsg"`
}

func (s *Service) getJSAPITicket(ctx context.Context) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	if s.jsapiTicket != "" && now.Before(s.jsapiTicketExpiry.Add(-cacheSafeWindow)) {
		return s.jsapiTicket, nil
	}

	accessToken, err := s.GetAccessTokenLocked(ctx, now)
	if err != nil {
		return "", err
	}

	endpoint := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=jsapi", url.QueryEscape(accessToken))
	var resp jsapiTicketResponse
	if err := s.getJSON(ctx, endpoint, &resp); err != nil {
		return "", err
	}
	if resp.ErrCode != 0 {
		return "", fmt.Errorf("wechat getticket failed: %d %s", resp.ErrCode, resp.ErrMsg)
	}
	if strings.TrimSpace(resp.Ticket) == "" {
		return "", fmt.Errorf("wechat getticket returned empty ticket")
	}

	s.jsapiTicket = resp.Ticket
	s.jsapiTicketExpiry = now.Add(time.Duration(resp.ExpiresIn) * time.Second)
	return s.jsapiTicket, nil
}

func (s *Service) GetAccessTokenLocked(ctx context.Context, now time.Time) (string, error) {
	if s.accessToken != "" && now.Before(s.accessTokenExpiry.Add(-cacheSafeWindow)) {
		return s.accessToken, nil
	}

	endpoint := fmt.Sprintf(
		"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s",
		url.QueryEscape(s.cfg.Wechat.AppID),
		url.QueryEscape(s.cfg.Wechat.AppSecret),
	)

	var resp accessTokenResponse
	if err := s.getJSON(ctx, endpoint, &resp); err != nil {
		return "", err
	}
	if resp.ErrCode != 0 {
		return "", fmt.Errorf("wechat token failed: %d %s", resp.ErrCode, resp.ErrMsg)
	}
	if strings.TrimSpace(resp.AccessToken) == "" {
		return "", fmt.Errorf("wechat token returned empty access_token")
	}

	s.accessToken = resp.AccessToken
	s.accessTokenExpiry = now.Add(time.Duration(resp.ExpiresIn) * time.Second)
	return s.accessToken, nil
}

func (s *Service) getJSON(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("wechat request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

func (s *Service) GetJSSDKConfig(ctx context.Context, in *models.WxRequest) (*models.WxResponse, error) {
	if strings.TrimSpace(s.cfg.Wechat.AppID) == "" {
		return nil, status.Error(codes.FailedPrecondition, "微信 AppID 未配置")
	}
	if strings.TrimSpace(s.cfg.Wechat.AppSecret) == "" {
		return nil, status.Error(codes.FailedPrecondition, "微信 AppSecret 未配置，无法生成扫一扫签名")
	}

	pageURL := strings.TrimSpace(in.Url)
	parsedURL, err := url.Parse(pageURL)
	if err != nil || parsedURL.Scheme == "" || parsedURL.Host == "" {
		return nil, status.Error(codes.InvalidArgument, "url 参数不合法")
	}

	jsapiTicket, err := s.getJSAPITicket(ctx)
	if err != nil {
		slog.Error("GetJSSDKConfig getJSAPITicket failed", slog.Any("error", err))
		return nil, status.Error(codes.Unavailable, "获取微信签名失败")
	}

	nonceStr, err := randomHex(16)
	if err != nil {
		slog.Error("GetJSSDKConfig randomHex failed", slog.Any("error", err))
		return nil, status.Error(codes.Internal, "生成微信签名失败")
	}

	timestamp := time.Now().Unix()
	return &models.WxResponse{
		AppId:     s.cfg.Wechat.AppID,
		Timestamp: timestamp,
		NonceStr:  nonceStr,
		Signature: signJSAPI(jsapiTicket, nonceStr, timestamp, pageURL),
	}, nil
}

func randomHex(size int) (string, error) {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func signJSAPI(jsapiTicket, nonceStr string, timestamp int64, pageURL string) string {
	payload := fmt.Sprintf("jsapi_ticket=%s&noncestr=%s&timestamp=%d&url=%s", jsapiTicket, nonceStr, timestamp, pageURL)
	sum := sha1.Sum([]byte(payload))
	return hex.EncodeToString(sum[:])
}
