package domain

import "time"

type Idea struct {
	ID        int
	Content   string
	Source    string
	CreatedAt time.Time
}
