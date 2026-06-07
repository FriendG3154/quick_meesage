package handler

import (
	wechatsvc "quick_message/backend/internal/service/wechat"
)

type WechatHandler struct {
	svc *wechatsvc.Service
}

func NewWechatHandler(svc *wechatsvc.Service) *WechatHandler {
	return &WechatHandler{svc: svc}
}
