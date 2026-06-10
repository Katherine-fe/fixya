import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "fixya_auth_token";
const basePath = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export interface AuthUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  role: "usuario" | "tecnico" | "administrador";
  avatarUrl?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: (role: "admin" | "tecnico" | "usuario") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  onUserChange,
}: {
  children: ReactNode;
  onUserChange?: () => void;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${basePath()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUser(data);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${basePath()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al iniciar sesión");
      }
      const { token, user: userData } = await res.json();
      localStorage.setItem(TOKEN_KEY, token);
      setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
      setUser(userData);
      onUserChange?.();
    },
    [onUserChange],
  );

  const loginAsDemo = useCallback(
    async (role: "admin" | "tecnico" | "usuario") => {
      const DEMO_CREDS = {
        admin: { email: "admin@fixya.com", password: "admin123" },
        tecnico: { email: "tecnico@fixya.com", password: "tecnico123" },
        usuario: { email: "cliente@fixya.com", password: "cliente123" },
      };
      await login(DEMO_CREDS[role].email, DEMO_CREDS[role].password);
    },
    [login],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
    setUser(null);
    onUserChange?.();
  }, [onUserChange]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
