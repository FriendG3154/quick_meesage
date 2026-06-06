mod:
	go mod tidy

run:
	go run ./backend/cmd/server/... -conf ./backend/configs/config.yaml

gen:
	cd backend && go generate ./...

ent:
	cd backend && ent generate --target ./ent ./schema

wire:
	cd backend/cmd/server && wire

VERSION ?= $(shell date +%Y.%-m.%-d)
BUILD_TIME ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS := -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(GIT_COMMIT)

.PHONY: build
build:
	@if [ "$(VERSION)" = "dev" ]; then \
		echo "\033[33m警告：未指定版本号，使用 make build VERSION=v1.0.0 指定\033[0m"; \
	fi
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -p 8 -ldflags "$(LDFLAGS)" -o ./backend/bin/ ./backend/cmd/...

.PHONY: tag
tag:
	@set -e; \
	tag="$(TAG)"; \
	if [ -z "$$tag" ]; then \
		printf "请输入 tag（例如 v1.0.0）: "; \
		read tag; \
	fi; \
	if [ -z "$$tag" ]; then \
		echo "tag 不能为空"; \
		exit 1; \
	fi; \
	if git rev-parse "$$tag" >/dev/null 2>&1; then \
		echo "tag 已存在: $$tag"; \
		exit 1; \
	fi; \
	msg="$(TAG_MSG)"; \
	if [ -z "$$msg" ]; then \
		printf "请输入 tag 说明（留空则默认 release $$tag）: "; \
		read msg; \
	fi; \
	if [ -z "$$msg" ]; then \
		msg="release $$tag"; \
	fi; \
	echo "即将创建并推送 tag: $$tag"; \
	echo "说明: $$msg"; \
	printf "确认继续？[y/N]: "; \
		read confirm; \
		case "$$confirm" in \
			y|Y|yes|YES) ;; \
			*) echo "已取消"; exit 1 ;; \
		esac; \
		git tag -a "$$tag" -m "$$msg"; \
		git push origin "$$tag"

.PHONY: gp
gp:
	@set -e; \
	msg="$(MSG)"; \
	if [ -z "$$msg" ]; then \
		printf "请输入 commit 信息: "; \
		read msg; \
	fi; \
	if [ -z "$$msg" ]; then \
		echo "commit 信息不能为空"; \
		exit 1; \
	fi; \
	if [ -z "$(shell git status --porcelain 2>/dev/null)" ]; then \
		echo "当前无可提交改动"; \
		exit 1; \
	fi; \
	branch="$$(git rev-parse --abbrev-ref HEAD)"; \
	echo "即将提交并推送到 origin/$$branch"; \
	echo "提交信息: $$msg"; \
	printf "确认继续？[y/N]: "; \
		read confirm; \
		case "$$confirm" in \
			y|Y|yes|YES) ;; \
			*) echo "已取消"; exit 1 ;; \
		esac; \
		git add -A; \
		git commit -m "$$msg"; \
		git push origin "$$branch"
