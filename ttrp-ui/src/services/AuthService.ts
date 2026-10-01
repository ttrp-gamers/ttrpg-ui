import {api} from './Api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export const AuthService = {
    login: async (credentials: LoginPayload) => {
    const response = await api.post('/auth/login', credentials);
    return response.data; 
  },

  register: async (credentials: RegisterPayload) => {
    const response = await api.post('/auth/register', credentials);
    return response.data; 
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/token-refresh', { refreshToken });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
}
