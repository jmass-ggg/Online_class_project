import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("auth_user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((token, nextUser) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("auth_user", JSON.stringify(nextUser));
    setAccessTokenState(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    sessionStorage.clear();
    setAccessTokenState(null);
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const token = response.data?.access || response.data?.access_token || response.data?.token;
    const nextUser = response.data?.user;
    if (!token || !nextUser) throw new Error("Login response is missing authentication data");
    saveAuth(token, nextUser);
    return nextUser;
  }, [saveAuth]);

  const reloadUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      const nextUser = response.data?.user || response.data;
      setUser(nextUser);
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
      setAccessTokenState(token);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    reloadUser();
  }, [reloadUser]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [logout]);

  const value = useMemo(() => ({
    accessToken,
    user,
    loading,
    isAuthenticated: Boolean(accessToken && user),
    login,
    logout,
    reloadUser
  }), [accessToken, user, loading, login, logout, reloadUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
