package models

type WxRequest struct {
	Code string `json:"code"`
	Url  string `json:"url"`
}

type WxResponse struct {
	Openid     string `json:"openid"`
	SessionKey string `json:"session_key"`
}
