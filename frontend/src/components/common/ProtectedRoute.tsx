import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authApi } from "../../api/auth";

export default function ProtectedRoute() {
  const { isAuthenticated, refreshToken, login, setUser, logout } =
    useAuthStore();
  const [loading, setLoading] = useState(!isAuthenticated && !!refreshToken);

  useEffect(() => {
    if (!isAuthenticated && refreshToken) {
      authApi
        .refresh(refreshToken)
        .then((tokens) => {
          login(tokens.access_token, tokens.refresh_token);
          return authApi.getMe();
        })
        .then((user) => setUser(user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, refreshToken, login, setUser, logout]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
