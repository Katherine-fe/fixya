import { useState } from "react";
import { useLocation } from "wouter";
import { useDevAuth } from "@/lib/dev-auth";

const ROLES = [
  {
    id: "admin",
    label: "Administrador",
    description: "Gestión completa de la plataforma, usuarios y técnicos",
    icon: "🛡️",
    color: "border-purple-200 bg-purple-50 hover:bg-purple-100",
    badge: "bg-purple-100 text-purple-800",
  },
  {
    id: "tecnico",
    label: "Técnico",
    description: "Ver solicitudes asignadas, gestionar trabajos y ganancias",
    icon: "🔧",
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    badge: "bg-blue-100 text-blue-800",
  },
  {
    id: "usuario",
    label: "Cliente",
    description: "Contratar técnicos, ver historial de solicitudes y pagos",
    icon: "👤",
    color: "border-green-200 bg-green-50 hover:bg-green-100",
    badge: "bg-green-100 text-green-800",
  },
];

export function DevLoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useDevAuth();

  async function handleLogin(roleId: string) {
    setLoading(roleId);
    setError(null);
    try {
      await login(roleId);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 mb-6 text-sm text-orange-800 flex items-start gap-2">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <div>
            <strong>Modo de desarrollo</strong> — Esta pantalla solo está disponible en entorno local. No aparece en producción.
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-3">
              <svg className="h-10 w-10 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso rápido</h1>
            <p className="text-slate-500 mt-1 text-sm">Selecciona un rol para entrar sin Clerk</p>
          </div>

          <div className="px-8 pb-8 space-y-3">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => handleLogin(role.id)}
                disabled={loading !== null}
                className={`w-full text-left rounded-xl border-2 px-4 py-4 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${role.color}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{role.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.badge}`}>
                        {role.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  </div>
                  {loading === role.id ? (
                    <svg className="h-5 w-5 animate-spin text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          FixYa · Modo desarrollo local
        </p>
      </div>
    </div>
  );
}
