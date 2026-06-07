package handler

import (
	"context"
	"quick_message/backend/internal/models"
	wechatsvc "quick_message/backend/internal/service/wechat"
)

type WechatHandler struct {
	svc *wechatsvc.Service
}

func NewWechatHandler(svc *wechatsvc.Service) *WechatHandler {
	return &WechatHandler{svc: svc}
}

func (h *WechatHandler) GetJSSDKConfig(ctx context.Context, in *models.WxRequest) (*models.WxResponse, error) {
	return h.svc.GetJSSDKConfig(ctx, in)
}
