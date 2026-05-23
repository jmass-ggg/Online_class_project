import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login/") &&
      !originalRequest.url?.includes("/auth/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken =
          refreshResponse.data?.access ||
          refreshResponse.data?.access_token ||
          refreshResponse.data?.token;

        if (!newAccessToken) {
          throw new Error("Refresh response missing access token");
        }

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("auth_user");

        window.dispatchEvent(new Event("auth:logout"));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;