# 快灵感后端

这是快灵感小程序的服务端基础骨架：

- gRPC：内部服务接口，契约在 `api/proto`。
- HTTP/JSON：小程序通过 `wx.request` 调用 `/api/v1/*`。
- Wire：装配配置、数据库、业务服务和传输层。
- ent：ORM schema 在 `ent/schema`。

## 本地运行

Windows PowerShell 可直接执行：

```bash
go mod tidy
go run entgo.io/ent/cmd/ent@v0.14.6 generate ./ent/schema
go run github.com/bufbuild/buf/cmd/buf@v1.70.0 generate
go run github.com/google/wire/cmd/wire@v0.7.0 ./internal/app
go test ./...
go run ./cmd/api
```

如果本机安装了 `make`，也可以使用 `make generate`、`make test`、`make run`。

默认监听：

- HTTP: `:8080`
- gRPC: `:9090`

可用环境变量：

- `HTTP_ADDR`
- `GRPC_ADDR`
- `DATABASE_URL`

## 小程序调用示例

```ts
wx.request({
  url: `${API_BASE}/api/v1/ideas`,
  method: 'POST',
  data: {
    content: '新的灵感',
    source: 'text',
  },
})
```

`GET /api/v1/ideas?limit=20&cursor=` 用于分页获取灵感列表。
