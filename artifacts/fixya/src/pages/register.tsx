import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export function RegisterPage() {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "", telefono: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al registrarse");
      }
      await login(form.email, form.password);
      queryClient.clear();
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(59,130,246,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%)" }} />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl font-bold">F</span>
              </div>
              <span className="text-white text-3xl font-extrabold tracking-tight">FixYa</span>
            </div>
            <p className="text-slate-400 text-sm">Crea tu cuenta gratuita</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Nombre</label>
                  <input type="text" {...field("nombre")} placeholder="Juan" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Apellido</label>
                  <input type="text" {...field("apellido")} placeholder="Pérez" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Correo electrónico</label>
                <input type="email" {...field("email")} placeholder="tu@correo.com" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Teléfono (opcional)</label>
                <input type="tel" {...field("telefono")} placeholder="999 888 777" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Contraseña</label>
                <input type="password" {...field("password")} placeholder="Mínimo 6 caracteres" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </>
                ) : "Crear cuenta gratis"}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-4">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
