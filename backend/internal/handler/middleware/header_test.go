package middleware

import "testing"

func TestIncomingHeaderMatcher_ClientVersion(t *testing.T) {
	key, ok := IncomingHeaderMatcher("Client-Version")
	if !ok {
		t.Fatal("expected Client-Version header to be forwarded")
	}
	if key != GatewayMetadataClientVersionKey {
		t.Fatalf("key = %q, want %q", key, GatewayMetadataClientVersionKey)
	}
}

func TestIncomingHeaderMatcher_DefaultHeader(t *testing.T) {
	key, ok := IncomingHeaderMatcher("Authorization")
	if !ok {
		t.Fatal("expected Authorization header to use default grpc-gateway forwarding")
	}
	if key == "" {
		t.Fatal("expected non-empty metadata key for Authorization header")
	}
}
