import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export type DevUser = {
  id: number;
  clerkId: string;
  nombre: string;
  apellido: string;
  email: string;
  role: "usuario" | "tecnico" | "administrador";
};

type DevAuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: DevUser }
  | { status: "unauthenticated" };

type DevAuthContextValue = {
  state: DevAuthState;
  login: (role: string) => Promise<void>;
  logout: () => Promise<void>;
};

const DevAuthContext = createContext<DevAuthContextValue | null>(null);

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DevAuthState>({ status: "loading" });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${basePath}/api/users/me`, { credentials: "include" });
      if (res.ok) {
        const user = await res.json();
        setState({ status: "authenticated", user });
      } else {
        setState({ status: "unauthenticated" });
      }
    } catch {
      setState({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async (role: string) => {
    const res = await fetch(`${basePath}/api/dev/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }
    await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await fetch(`${basePath}/api/dev/logout`, {
      method: "POST",
      credentials: "include",
    });
    setState({ status: "unauthenticated" });
  }, []);

  return (
    <DevAuthContext.Provider value={{ state, login, logout }}>
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  const ctx = useContext(DevAuthContext);
  if (!ctx) throw new Error("useDevAuth must be used inside DevAuthProvider");
  return ctx;
}
