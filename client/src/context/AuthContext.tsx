import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/authApi";
import { ACCESS_TOKEN_KEY } from "@/utils/constants";
import type { LoginPayload, SignupPayload, User } from "@/contracts/user.types";

const REFRESH_TOKEN_KEY = "destinai_refresh_token";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  signup: (payload: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Clears every piece of local session state */
function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Belt-and-suspenders: also clear sessionStorage
  try { sessionStorage.clear(); } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // On mount: validate stored access token by fetching /users/me
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    authApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => { clearSession(); setUser(null); })
      .finally(() => setIsLoading(false));
  }, []);

  // Global session-expired event (fired by axiosClient when refresh fails)
  useEffect(() => {
    const handle = () => {
      clearSession();
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener("destinai:session-expired", handle);
    return () => window.removeEventListener("destinai:session-expired", handle);
  }, [queryClient]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
    if (result.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    setUser(result.user);
    return result.user;
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const result = await authApi.signup(payload);
    localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
    if (result.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local cleanup even if server call fails
    } finally {
      clearSession();
      setUser(null);
      queryClient.clear();   // Clears all TanStack Query cache
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
