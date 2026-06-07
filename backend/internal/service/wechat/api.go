package wechatsvc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
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

	accessToken, err := s.getAccessTokenLocked(ctx, now)
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

func (s *Service) getAccessTokenLocked(ctx context.Context, now time.Time) (string, error) {
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
