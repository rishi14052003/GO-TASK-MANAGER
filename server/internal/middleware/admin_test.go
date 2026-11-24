package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestAdminAccess(t *testing.T) {
	secret := []byte("test-only")
	for _, tc := range []struct {
		name    string
		role    any
		current bool
		want    int
	}{
		{"missing role", nil, false, 403},
		{"ordinary user", false, false, 403},
		{"role removed", true, false, 403},
		{"admin", true, true, 204},
	} {
		t.Run(tc.name, func(t *testing.T) {
			claims := jwt.MapClaims{"user_id": 7, "exp": time.Now().Add(time.Minute).Unix()}
			if tc.role != nil {
				claims["is_admin"] = tc.role
			}
			token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
			if err != nil {
				t.Fatal(err)
			}
			check := func(ctx context.Context, id int) (bool, error) {
				if id != 7 || tc.role != true {
					t.Fatal("unexpected role lookup")
				}
				return tc.current, nil
			}
			handler := AuthMiddleware(secret, AdminMiddleware(check, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusNoContent)
			})))
			req := httptest.NewRequest(http.MethodGet, "/api/admin/stats", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, req)
			if response.Code != tc.want {
				t.Fatalf("got %d, want %d", response.Code, tc.want)
			}
		})
	}
}
