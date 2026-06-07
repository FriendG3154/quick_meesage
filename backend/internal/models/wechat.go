package models

type WxRequest struct {
	Code string `json:"code"`
	Url  string `json:"url"`
}

type WxResponse struct {
	AppId     string `json:"openid"`
	Timestamp int64  `json:"timestamp"`
	NonceStr  string `json:"nonce_str"`
	Signature string `json:"signature"`
}
