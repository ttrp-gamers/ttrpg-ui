import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../../services/AuthService';
import type { LoginPayload, RegisterPayload } from '../../services/AuthService';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (credentials: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // a broken saved value must not crash the app
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginPayload) => {
    const data = await AuthService.login(credentials);
    if (!data?.accessToken) {
      throw new Error('Login response has no accessToken');
    }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const register = async (credentials: RegisterPayload) => {
    await AuthService.register(credentials);
  };

  const logout = async () => {
    await AuthService.logout();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
      <AuthContext.Provider value={{ user, loading, login, register, logout }}>
        {!loading && children}
      </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;