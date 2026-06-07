package user

import (
	"context"
	"quick_message/backend/ent"

	"github.com/google/uuid"
)

func (r *UserRepo) Get(ctx context.Context, id uuid.UUID) (*ent.User, error) {
	return r.GetClient(ctx).User.Get(ctx, id)
}

// / create 创建用户。
func (r *UserRepo) create(ctx context.Context, user *ent.User) (*ent.User, error) {
	return r.GetClient(ctx).User.Create().
		SetID(user.ID).
		SetPhone(user.Phone).
		SetWxOpenid(user.WxOpenid).
		SetWxName(user.WxName).
		SetRoleType(user.RoleType).
		SetAuthID(user.AuthID).
		Save(ctx)
}

// / 修改用户名
func (r *UserRepo) update(ctx context.Context, user *ent.User) (*ent.User, error) {
	return r.GetClient(ctx).User.UpdateOne(user).
		SetWxName(user.WxName).
		Save(ctx)
}
