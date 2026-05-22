import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let isRefreshing = false;
let refreshSubscribers = [];

function getAccessToken() {
  return localStorage.getItem("access_token");
}

function setAccessToken(token) {
  if (token) localStorage.setItem("access_token", token);
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_user");
  window.dispatchEvent(new Event("auth:logout"));
}

function subscribeToRefresh(callback) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, { withCredentials: true });
      const newToken = response.data?.access || response.data?.access_token || response.data?.token;
      if (!newToken) throw new Error("Refresh response did not include an access token");
      setAccessToken(newToken);
      axiosClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      notifyRefreshSubscribers(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      notifyRefreshSubscribers(null);
      clearAuth();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
