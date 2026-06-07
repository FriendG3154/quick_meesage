package wechatsvc

import (
	"net/http"
	"sync"
	"time"

	"quick_message/backend/internal/conf"
)

const cacheSafeWindow = 5 * time.Minute

// Service 微信相关服务。
type Service struct {
	cfg        *conf.Config
	httpClient *http.Client

	mu                sync.Mutex
	accessToken       string
	accessTokenExpiry time.Time
	jsapiTicket       string
	jsapiTicketExpiry time.Time
}

func NewService(cfg *conf.Config) *Service {
	return &Service{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}
