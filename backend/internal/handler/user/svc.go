package usersvc

import (
	"quick_message/backend/internal/data"
)

// Service implements the actuator service.
type Service struct {
	data *data.Client
}

// NewService creates a new Service.
func NewService(data *data.Client) *Service {
	return &Service{
		data: data,
	}
}
