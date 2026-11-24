package middleware

import (
	"context"
	"net/http"
)

type AdminCheck func(context.Context, int) (bool, error)

func AdminMiddleware(check AdminCheck, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claimed, _ := r.Context().Value(adminKey).(bool)
		id, ok := r.Context().Value(UserIDKey).(int)
		if !claimed || !ok {
			writeError(w, http.StatusForbidden, "Admin access required")
			return
		}
		allowed, err := check(r.Context(), id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Unable to verify admin access")
			return
		}
		if !allowed {
			writeError(w, http.StatusForbidden, "Admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}
