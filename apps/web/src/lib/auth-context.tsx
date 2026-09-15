"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, usersApi, ApiError, type User, type SellerProfile } from "./api-client";

function dashboardFor(role: User["role"]) {
  return role === "SELLER" || role === "ADMIN" ? "/dashboard/seller" : "/dashboard/buyer";
}

interface AuthUser extends User {
  sellerProfile: SellerProfile | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: "BUYER" | "SELLER";
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await usersApi.me();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      }
    }
  }, []);

  // On mount, check if there is already a valid session cookie.
  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      await authApi.login({ email, password });
      const { user: me } = await usersApi.me();
      setUser(me);
      router.push(dashboardFor(me.role));
    },
    [router]
  );

  const signup = useCallback(
    async (data: { name: string; email: string; password: string; role: "BUYER" | "SELLER" }) => {
      await authApi.signup(data);
      const { user: me } = await usersApi.me();
      setUser(me);
      router.push(dashboardFor(me.role));
    },
    [router]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
