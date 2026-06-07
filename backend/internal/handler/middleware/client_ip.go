package middleware

import (
	"context"
	"strings"

	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/peer"
)

func GetGrpcClientIP(ctx context.Context) string {
	// 获取客户端 IP
	clientIP := ""
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		// 优先从 X-Real-IP 获取（Nginx proxy_set_header X-Real-IP $remote_addr）
		if realIP := md.Get("x-real-ip"); len(realIP) > 0 {
			clientIP = realIP[0]
		} else if forwarded := md.Get("x-forwarded-for"); len(forwarded) > 0 {
			// X-Forwarded-For 格式: "client, proxy1, proxy2"，取第一个即真实客户端 IP
			clientIP = strings.TrimSpace(strings.Split(forwarded[0], ",")[0])
		} else if addrs := md.Get("grpcgateway-x-forwarded-for"); len(addrs) > 0 {
			clientIP = strings.TrimSpace(strings.Split(addrs[0], ",")[0])
		} else if ips := md.Get("client-ip"); len(ips) > 0 {
			clientIP = ips[0]
		}
	}

	// 回退到直连 IP（无代理时）
	if clientIP == "" {
		if p, ok := peer.FromContext(ctx); ok {
			clientIP = p.Addr.String()
		}
	}

	return clientIP
}
