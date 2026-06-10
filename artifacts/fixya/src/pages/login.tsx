import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

const DEMO_ROLES = [
  {
    key: "admin" as const,
    label: "Administrador",
    email: "admin@fixya.com",
    password: "admin123",
    color: "from-purple-600 to-purple-700",
    icon: "🛡️",
  },
  {
    key: "tecnico" as const,
    label: "Técnico",
    email: "tecnico@fixya.com",
    password: "tecnico123",
    color: "from-blue-600 to-blue-700",
    icon: "🔧",
  },
  {
    key: "usuario" as const,
    label: "Cliente",
    email: "cliente@fixya.com",
    password: "cliente123",
    color: "from-emerald-600 to-emerald-700",
    icon: "👤",
  },
];

export function LoginPage() {
  const { login, loginAsDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("form");
    try {
      await login(email, password);
      queryClient.clear();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(null);
    }
  }

  async function handleDemoLogin(role: "admin" | "tecnico" | "usuario") {
    setError(null);
    setLoading(role);
    try {
      await loginAsDemo(role);
      queryClient.clear();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión como demo");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.2) 0%, transparent 50%)" }} />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-3 mb-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white text-2xl font-bold">F</span>
              </div>
              <span className="text-white text-3xl font-extrabold tracking-tight">FixYa</span>
            </motion.div>
            <p className="text-slate-400 text-sm mt-1">Plataforma de servicios técnicos</p>
          </div>

          {/* Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            
            {/* Demo access */}
            <div className="mb-6">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
                Acceso Rápido Demo
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map((role) => (
                  <motion.button
                    key={role.key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDemoLogin(role.key)}
                    disabled={loading !== null}
                    className={`bg-gradient-to-br ${role.color} text-white rounded-xl p-3 flex flex-col items-center gap-1.5 text-center transition-all shadow-lg disabled:opacity-50 hover:brightness-110`}
                  >
                    {loading === role.key ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="text-xl">{role.icon}</span>
                    )}
                    <span className="text-xs font-semibold leading-tight">{role.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {DEMO_ROLES.map((role) => (
                  <div key={role.key} className="flex items-center justify-between text-xs text-white/40">
                    <span>{role.label}</span>
                    <span className="font-mono">{role.email} / {role.password}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-3 text-white/40 text-xs uppercase tracking-widest">
                  o ingresa con tu cuenta
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading === "form" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-4">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            © 2026 FixYa — Plataforma de servicios técnicos del hogar
          </p>
        </motion.div>
      </div>
    </div>
  );
}
