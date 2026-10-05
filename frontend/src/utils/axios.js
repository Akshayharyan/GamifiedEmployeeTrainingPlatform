// Fetch-based HTTP client with automatic token refresh
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

const API = {
  baseURL: `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api`,

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = localStorage.getItem("accessToken");

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token, user must login again
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return response;
      }

      if (!refreshTokenInProgress) {
        refreshTokenInProgress = true;

        try {
          const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;

            localStorage.setItem("accessToken", newAccessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            processQueue(null, newAccessToken);

            // Retry original request with new token
            headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, {
              ...options,
              headers,
            });
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            processQueue(new Error("Token refresh failed"));
            window.location.href = "/login";
          }
        } catch (err) {
          console.error("Token refresh failed:", err);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          processQueue(err);
          window.location.href = "/login";
        } finally {
          refreshTokenInProgress = false;
        }
      } else {
        // Token refresh already in progress, wait for it
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.Authorization = `Bearer ${newToken}`;
          return fetch(url, { ...options, headers });
        });
      }
    }

    return response;
  },

  async get(endpoint, options = {}) {
    const response = await this.request(endpoint, { ...options, method: "GET" });
    if (!response.ok && response.status !== 401) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },

  async post(endpoint, body, options = {}) {
    const response = await this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!response.ok && response.status !== 401) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },

  async put(endpoint, body, options = {}) {
    const response = await this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!response.ok && response.status !== 401) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },

  async delete(endpoint, options = {}) {
    const response = await this.request(endpoint, { ...options, method: "DELETE" });
    if (!response.ok && response.status !== 401) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },
};

export default API;
