package user

import "quick_message/backend/internal/data/repoiface"

type UserRepo struct {
	*repoiface.Base
}

func NewUserRepo(base *repoiface.Base) *UserRepo {
	return &UserRepo{Base: base}
}
