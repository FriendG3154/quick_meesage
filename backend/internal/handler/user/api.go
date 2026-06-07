package usersvc

import (
	"quick_message/backend/ent"
)

// ProfileResult GetProfile 的聚合返回
type ProfileResult struct {
	User *ent.User
	Auth *ent.Auth
}

// / 创建用户改为微信小程序创建,不再暴露手机号注册接口。
// func (s *Service) CreateWxUser(ctx context.Context, in *v1.CreateUserRequest) (*ent.User, error) {

// }
