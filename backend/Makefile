.PHONY: test generate ent proto wire run

test:
	go test ./...

generate: ent proto wire

ent:
	go run entgo.io/ent/cmd/ent generate --feature sql/modifier,sql/execquery,sql/upsert,sql/lock --target ./ent ./schema

proto:
	go run github.com/bufbuild/buf/cmd/buf@v1.70.0 generate

wire:
	go run github.com/google/wire/cmd/wire@v0.7.0 ./internal/app

run:
	go run ./cmd/api
