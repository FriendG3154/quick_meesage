package middleware

import (
	"context"
	"net/http"
	"quick_message/backend/internal/manager/iam"
	"strings"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
)

const (
	// AccessTokenCookieName is the cookie name of access token.
	AccessTokenCookieName = "access-token"
	// UserIDCookieName is the cookie name of user ID.
	UserIDCookieName = "user"

	// GatewayMetadataAccessTokenKey is the gateway metadata key for access token.
	GatewayMetadataAccessTokenKey = "gateway-access-token"
	// GatewayMetadataUserIDKey is the gateway metadata key for user ID.
	GatewayMetadataUserIDKey = "gateway-user"
	// GatewayMetadataRequestOriginKey is the gateway metadata key for the request origin header.
	GatewayMetadataRequestOriginKey = "gateway-request-origin"
	// GatewayMetadataClientVersionKey is the gateway metadata key for the client version header.
	GatewayMetadataClientVersionKey = "client-version"
)

// IncomingHeaderMatcher forwards selected HTTP request headers into grpc-gateway metadata.
func IncomingHeaderMatcher(key string) (string, bool) {
	if strings.EqualFold(key, "Client-Version") {
		return GatewayMetadataClientVersionKey, true
	}
	return runtime.DefaultHeaderMatcher(key)
}

// Modify is the mux option for modifying response header.
func (m *Interceptor) Modify(ctx context.Context, response http.ResponseWriter, _ proto.Message) error {
	md, ok := runtime.ServerMetadataFromContext(ctx)
	if !ok {
		return errors.Errorf("failed to get ServerMetadata from context in the gateway response modifier")
	}

	isHTTPS := false
	for _, v := range md.HeaderMD.Get(GatewayMetadataRequestOriginKey) {
		if strings.HasPrefix(v, "https") {
			isHTTPS = true
		}
	}
	m.processMetadata(ctx, md, GatewayMetadataAccessTokenKey, AccessTokenCookieName, true /* httpOnly */, isHTTPS, response)
	m.processMetadata(ctx, md, GatewayMetadataUserIDKey, UserIDCookieName, false /* httpOnly */, isHTTPS, response)
	return nil
}

func (m *Interceptor) processMetadata(ctx context.Context, md runtime.ServerMetadata, metadataKey, cookieName string, httpOnly, isHTTPS bool, response http.ResponseWriter) {
	values := md.HeaderMD.Get(metadataKey)
	if len(values) == 0 {
		return
	}
	value := values[0]
	if value == "" {
		// Unset cookie.
		http.SetCookie(response, &http.Cookie{
			Name:    cookieName,
			Value:   "",
			Expires: time.Unix(0, 0),
			Path:    "/",
		})
	} else {
		// Set cookie.
		sameSite := http.SameSiteStrictMode
		if isHTTPS {
			sameSite = http.SameSiteNoneMode
		}
		http.SetCookie(response, &http.Cookie{
			Name:  cookieName,
			Value: value,
			// CookieExpDuration expires slightly earlier than the jwt expiration. Client would be logged out if the user
			// cookie expires, thus the client would always logout first before attempting to make a request with the expired jwt.
			// Suppose we have a valid refresh token, we will refresh the token in 2 cases:
			// 1. The access token is about to expire in <<refreshThresholdDuration>>
			// 2. The access token has already expired, we refresh the token so that the ongoing request can pass through.
			Expires: time.Now().Add(iam.AccessTokenExpireDuration - time.Second),
			Path:    "/",
			// Http-only helps mitigate the risk of client side script accessing the protected cookie.
			HttpOnly: httpOnly,
			Secure:   isHTTPS,
			SameSite: sameSite,
		})
	}
}
