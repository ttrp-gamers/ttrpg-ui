import axios from "axios";

const API_BASE_URL = 'http://localhost:8080/api';

const getAccessToken = () => {
  const token = localStorage.getItem("accessToken");
  return token && token !== "null" && token !== "undefined" && token.trim() !== ""
    ? token
    : null;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    // Strictly check that token exists and is valid string before adding header
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/auth/");


      if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token-refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export interface ProfileResponse {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
}

export interface UpdateProfileBody {
    username?: string;
    avatarUrl?: string;
    bio?: string;
    currentPassword?: string;
    newPassword?: string;
}

export const getProfile = () =>
    api.get<ProfileResponse>('/v1/user/profile').then((res) => res.data);

export const updateProfile = (body: UpdateProfileBody) =>
    api.put<ProfileResponse>('/v1/user/profile', body).then((res) => res.data);




