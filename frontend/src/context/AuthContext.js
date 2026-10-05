// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refreshToken")
  );
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Use ref to track newly logged-in tokens to avoid refreshUser using stale closure
  const justLoggedInRef = useRef(false);

  const isAuthenticated = !!accessToken;

  /* =========================
     PERSIST AUTH
  ========================= */
  useEffect(() => {
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    else localStorage.removeItem("accessToken");

    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    else localStorage.removeItem("refreshToken");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user, accessToken, refreshToken]);

  /* =========================
     🔄 AUTO-REFRESH TOKEN
  ========================= */
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.warn("⚠️ No refresh token available");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.status === 401) {
        // Refresh token is invalid, clear auth
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        return false;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Token refresh failed");

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      console.log("✅ Token refreshed successfully");
      return true;
    } catch (err) {
      console.error("❌ Token refresh failed:", err);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      return false;
    }
  };

  /* =========================
     🔍 REFRESH USER (SOURCE OF TRUTH)
  ========================= */
  const refreshUser = async (token) => {
    // Use provided token or current state token
    const tokenToUse = token || accessToken;
    
    if (!tokenToUse) {
      console.warn("⚠️ No token available for refreshUser");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      // If token expired, try to refresh and retry
      if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return refreshUser(); // Retry with new token
        }
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setUser(data);
        console.log("✅ User profile refreshed");
      }
    } catch (err) {
      console.error("❌ refreshUser failed:", err);
    }
  };

  /* =========================
     🔁 AUTO SYNC ON LOAD / TOKEN CHANGE
  ========================= */
  useEffect(() => {
    if (accessToken) {
      console.log("📍 Token changed, refreshing user profile...");
      refreshUser(accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /* =========================
     REGISTER
  ========================= */
  const register = async (name, email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      // Don't call refreshUser here - let useEffect handle it after state updates
      console.log("✅ Registration successful");

      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGIN
  ========================= */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      console.log("🟢 Login response received:", {
        user: data.user?.email,
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
      });

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      // Don't call refreshUser here - let useEffect handle it after state updates
      console.log("✅ Login successful, tokens stored");

      return { success: true, role: data.user.role };
    } catch (err) {
      console.error("❌ Login failed:", err);
      setAuthError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = async () => {
    try {
      // Call logout endpoint to clear refresh token from DB
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setAuthError(null);
      console.log("✅ Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        accessToken,
        token: accessToken,  // ✅ Backward compatibility alias
        refreshToken,
        refreshAccessToken,
        isAuthenticated,
        loading,
        authError,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
