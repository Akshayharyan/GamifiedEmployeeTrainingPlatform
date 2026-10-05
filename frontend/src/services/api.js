/**
 * API Fetch Utility with Automatic Token Refresh
 * Automatically handles token expiration and refresh
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

let refreshTokenInProgress = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Main API fetch function with auto-refresh
 * @param {string} endpoint - API endpoint (e.g., '/api/user/me')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiCall = async (endpoint, options = {}) => {
  let accessToken = localStorage.getItem("accessToken");
  let refreshToken = localStorage.getItem("refreshToken");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401 && refreshToken && !refreshTokenInProgress) {
    refreshTokenInProgress = true;

    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newAccessToken);

        // Retry original request with new token
        headers.Authorization = `Bearer ${newAccessToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        processQueue(new Error("Token refresh failed"));
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      processQueue(err);
      window.location.href = "/login";
    } finally {
      refreshTokenInProgress = false;
    }
  }

  return response;
};

/**
 * Wrapper for GET requests
 */
export const get = (endpoint, options = {}) =>
  apiCall(endpoint, { ...options, method: "GET" });

/**
 * Wrapper for POST requests
 */
export const post = (endpoint, body, options = {}) =>
  apiCall(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });

/**
 * Wrapper for PUT requests
 */
export const put = (endpoint, body, options = {}) =>
  apiCall(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });

/**
 * Wrapper for PATCH requests
 */
export const patch = (endpoint, body, options = {}) =>
  apiCall(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });

/**
 * Wrapper for DELETE requests
 */
export const del = (endpoint, options = {}) =>
  apiCall(endpoint, { ...options, method: "DELETE" });

export default {
  apiCall,
  get,
  post,
  put,
  patch,
  del,
};
