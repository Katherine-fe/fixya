import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { authJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, Smartphone, Banknote, CheckCircle, Calendar,
  TrendingUp, Briefcase, ArrowRight, Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getServiceEmoji } from "@/lib/serviceIcon";

// ─── Types ────────────────────────────────────────────────────────────────────
type Payment = {
  id: number;
  monto: number;
  metodoPago: string;
  status: string;
  referencia: string;
  createdAt: string;
  requestId: number;
  descripcion?: string;
  servicio?: string;
  servicioIcono?: string;
};

type TechEarning = Payment & {
  cliente: string;
  clienteAvatar: string | null;
  fechaServicio: string | null;
  direccion: string;
};

type EarningsSummary = {
  totalHistorico: number;
  estesMes: number;
  totalTrabajos: number;
  ticketPromedio: number;
};

type MonthlyData = { mes: string; ingresos: number };

// ─── Config ───────────────────────────────────────────────────────────────────
const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; emoji: string }> = {
  yape:     { label: "Yape",     icon: <Smartphone className="w-4 h-4" />, color: "bg-purple-100 text-purple-800 border-purple-200", emoji: "🟣" },
  plin:     { label: "Plin",     icon: <Smartphone className="w-4 h-4" />, color: "bg-teal-100 text-teal-800 border-teal-200",       emoji: "🟢" },
  tarjeta:  { label: "Tarjeta",  icon: <CreditCard className="w-4 h-4" />, color: "bg-blue-100 text-blue-800 border-blue-200",       emoji: "💳" },
  efectivo: { label: "Efectivo", icon: <Banknote className="w-4 h-4" />,   color: "bg-amber-100 text-amber-800 border-amber-200",    emoji: "💵" },
};

const CHART_COLORS = ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton({ title }: { title: string }) {
  return (
    <DashboardLayout title={title}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-56 rounded-2xl mb-6" />
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </DashboardLayout>
  );
}

// ─── TECHNICIAN EARNINGS VIEW ─────────────────────────────────────────────────
function TechEarningsView() {
  const [earnings, setEarnings] = useState<TechEarning[]>([]);
  const [monthly,  setMonthly]  = useState<MonthlyData[]>([]);
  const [summary,  setSummary]  = useState<EarningsSummary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<string>("");

  useEffect(() => {
    authJson<{ payments: TechEarning[]; monthly: MonthlyData[]; summary: EarningsSummary }>(
      "/api/payments/my-earnings"
    )
      .then((data) => {
        setEarnings(data.payments);
        setMonthly(data.monthly);
        setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton title="Mis Ingresos" />;

  const filtered = filter
    ? earnings.filter((p) => p.metodoPago === filter)
    : earnings;

  const methods = [...new Set(earnings.map((p) => p.metodoPago))];

  return (
    <DashboardLayout title="Mis Ingresos">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white overflow-hidden relative">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-semibold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Total histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-black">{formatCurrency(summary?.totalHistorico ?? 0)}</div>
              <p className="text-blue-200 text-xs mt-1">{summary?.totalTrabajos ?? 0} trabajos completados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card className="bg-emerald-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Este mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-black text-emerald-700">{formatCurrency(summary?.estesMes ?? 0)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Card className="bg-violet-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-violet-600" /> Pagos recibidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-black text-violet-700">{summary?.totalTrabajos ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
          <Card className="bg-amber-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-600" /> Ticket promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-black text-amber-700">{formatCurrency(summary?.ticketPromedio ?? 0)}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Chart */}
      {monthly.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">Ingresos por mes</CardTitle>
              <p className="text-sm text-slate-500">Evolución de tus ganancias en los últimos meses</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [`S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`, "Ingresos"]}
                    contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: 12 }}
                  />
                  <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {monthly.map((_, i) => (
                      <Cell key={i} fill={i === monthly.length - 1 ? "#2563eb" : CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter by payment method */}
      {methods.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos ({earnings.length})
          </button>
          {methods.map((m) => {
            const cfg = METHOD_CONFIG[m];
            const count = earnings.filter((p) => p.metodoPago === m).length;
            return (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  filter === m ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cfg?.emoji} {cfg?.label ?? m} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Earnings list */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">💼</div>
          <p className="text-slate-500 font-medium text-lg mb-2">Aún no tienes ingresos registrados</p>
          <p className="text-slate-400 text-sm mb-6">Cuando un cliente pague por tu servicio, aparecerá aquí.</p>
          <Button asChild>
            <Link href="/solicitudes" className="flex items-center gap-2">
              Ver solicitudes disponibles <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filtered.map((p, i) => {
              const cfg = METHOD_CONFIG[p.metodoPago] ?? { label: p.metodoPago, icon: <CreditCard className="w-4 h-4" />, color: "bg-slate-100 text-slate-600 border-slate-200", emoji: "💳" };
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Client avatar */}
                    <div className="shrink-0">
                      {p.clienteAvatar ? (
                        <img src={p.clienteAvatar} alt={p.cliente}
                          className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {p.cliente.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{p.cliente}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {p.servicio && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                                {getServiceEmoji(p.servicioIcono ?? "")} {p.servicio}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                              {cfg.emoji} {cfg.label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" /> Completado
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-slate-900">{formatCurrency(p.monto)}</p>
                        </div>
                      </div>

                      {p.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{p.descripcion}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.createdAt)}
                        </span>
                        <span className="font-mono text-slate-300">{p.referencia}</span>
                        <Link href={`/solicitudes/${p.requestId}`}
                          className="ml-auto text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                          Ver solicitud <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}

// ─── CLIENT PAYMENTS VIEW ─────────────────────────────────────────────────────
function ClientPaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("");
  const [page,     setPage]     = useState(1);
  const LIMIT = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filter) params.set("status", filter);
      const data = await authJson<{ payments: Payment[]; total: number }>(`/api/payments?${params}`);
      setPayments(data.payments);
      setTotal(data.total);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  if (loading) return <PageSkeleton title="Mis Pagos" />;

  const totalAmount  = payments.reduce((s, p) => s + p.monto, 0);
  const totalPages   = Math.ceil(total / LIMIT);

  // Group by method for summary
  const byMethod = payments.reduce((acc, p) => {
    acc[p.metodoPago] = (acc[p.metodoPago] || 0) + p.monto;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout title="Mis Pagos">
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white">
            <CardContent className="pt-5">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">Total pagado</p>
              <p className="text-3xl font-black">{formatCurrency(totalAmount)}</p>
              <p className="text-blue-300 text-xs mt-1">{total} transacciones en total</p>
            </CardContent>
          </Card>
          {Object.entries(byMethod).slice(0, 2).map(([method, amount]) => {
            const cfg = METHOD_CONFIG[method] ?? { label: method, icon: <CreditCard className="w-4 h-4" />, color: "", emoji: "💳" };
            return (
              <Card key={method} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {cfg.emoji} {cfg.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(amount)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {payments.filter((p) => p.metodoPago === method).length} pagos
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[{ value: "", label: "Todos" }, { value: "completado", label: "Completados" }, { value: "pendiente", label: "Pendientes" }].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-slate-500 font-medium">No tienes pagos registrados.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {payments.map((p, i) => {
              const cfg = METHOD_CONFIG[p.metodoPago] ?? { label: p.metodoPago, icon: <CreditCard className="w-4 h-4" />, color: "bg-slate-100 text-slate-700 border-slate-200", emoji: "💳" };
              return (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.color} shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {p.servicio && (
                          <span className="font-semibold text-slate-900 text-sm">
                            {getServiceEmoji(p.servicioIcono ?? "")} {p.servicio}
                          </span>
                        )}
                        {!p.servicio && <span className="font-semibold text-slate-900 text-sm">Pago #{p.id}</span>}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                          {cfg.emoji} {cfg.label}
                        </span>
                        {p.status === "completado" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> Completado
                          </span>
                        )}
                      </div>
                      {p.descripcion && <p className="text-xs text-slate-400 line-clamp-1">{p.descripcion}</p>}
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(p.createdAt)}
                        </span>
                        <span className="font-mono text-slate-300 truncate">{p.referencia}</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-900 shrink-0">{formatCurrency(p.monto)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="px-4 py-2 text-sm text-slate-600">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export function PagosPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "tecnico" ? <TechEarningsView /> : <ClientPaymentsView />;
}
