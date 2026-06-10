import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import {
  FileText, CreditCard, Wrench, TrendingUp, Star, CheckCircle2,
  Download, ArrowUpRight, ArrowDownRight, Users, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "framer-motion";
import { motion } from "framer-motion";

type Tab = "servicios" | "pagos" | "tecnicos";

const COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d","#65a30d","#ea580c","#0284c7"];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: "Pendiente",   color: "#d97706", bg: "#fef3c7" },
  aceptada:    { label: "Aceptada",    color: "#2563eb", bg: "#dbeafe" },
  en_progreso: { label: "En Progreso", color: "#7c3aed", bg: "#ede9fe" },
  completada:  { label: "Completada",  color: "#16a34a", bg: "#dcfce7" },
  cancelada:   { label: "Cancelada",   color: "#dc2626", bg: "#fee2e2" },
  rechazada:   { label: "Rechazada",   color: "#6b7280", bg: "#f3f4f6" },
};

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1200; const start = Date.now();
    const raf = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCurrent(e * value);
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, value]);
  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString("es-PE")}{suffix}
    </span>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void;
  icon: React.ComponentType<{ className?: string }>; label: string;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      )}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function KpiCard({ label, value, prefix = "", suffix = "", icon: Icon, color, trend, trendLabel, decimals = 0 }: {
  label: string; value: number; prefix?: string; suffix?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
  trend?: number; trendLabel?: string; decimals?: number;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}% {trendLabel ?? "vs. mes anterior"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("ingres") ? `S/ ${p.value.toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── SERVICIOS ────────────────────────────────────────────────────────────────
function ServiciosReport() {
  const [byStatus, setByStatus]     = useState<{ status: string; count: number }[]>([]);
  const [popularity, setPopularity] = useState<{ serviceName: string; count: number; porcentaje: number }[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fixya_auth_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    Promise.all([
      fetch(`${base}/api/dashboard/requests-by-status`, { headers }).then(r => r.json()),
      fetch(`${base}/api/dashboard/services-popularity`, { headers }).then(r => r.json()),
    ]).then(([s, p]) => {
      setByStatus(Array.isArray(s) ? s : []);
      setPopularity(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SectionSkeleton />;

  const total       = byStatus.reduce((s, d) => s + d.count, 0);
  const completadas = byStatus.find(d => d.status === "completada")?.count ?? 0;
  const pendientes  = byStatus.find(d => d.status === "pendiente")?.count ?? 0;
  const enProgreso  = byStatus.find(d => d.status === "en_progreso")?.count ?? 0;
  const tasa        = total > 0 ? ((completadas / total) * 100).toFixed(1) : "0";
  const statusData  = byStatus.filter(d => d.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Solicitudes" value={total}        icon={FileText}     color="bg-blue-100 text-blue-600"    trend={18} />
        <KpiCard label="Completadas"        value={completadas}  icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" trend={22} />
        <KpiCard label="En progreso"        value={enProgreso}  icon={Zap}          color="bg-violet-100 text-violet-600" />
        <KpiCard label="Tasa de éxito"      value={parseFloat(tasa)} icon={TrendingUp} color="bg-amber-100 text-amber-600" suffix="%" decimals={1} trend={3} />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Distribución por Estado</CardTitle>
            <CardDescription>Solicitudes actuales en cada etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_LABELS[entry.status]?.color ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {statusData.map((d) => {
                const cfg = STATUS_LABELS[d.status];
                return (
                  <div key={d.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg?.color }} />
                      <span className="text-xs text-slate-600 font-medium">{cfg?.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%`, backgroundColor: cfg?.color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 w-5 text-right">{d.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Categorías más solicitadas</CardTitle>
            <CardDescription>Ranking de servicios por número de solicitudes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={popularity} layout="vertical" margin={{ left: 20, right: 50 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="serviceName" type="category" width={120} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Solicitudes" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {popularity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── PAGOS ────────────────────────────────────────────────────────────────────
type PaymentMethod = { method: string; label: string; count: number; total: number };
type RevenueMonth  = { mes: string; ingresos: number; solicitudes: number };

const PM_COLORS = ["#7c3aed", "#0891b2", "#2563eb"];
const PM_EMOJI: Record<string, string> = { yape: "🟣", plin: "🟢", tarjeta: "💳" };

function PagosReport() {
  const [revenue,  setRevenue]  = useState<RevenueMonth[]>([]);
  const [pmData,   setPmData]   = useState<PaymentMethod[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fixya_auth_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    Promise.all([
      fetch(`${base}/api/dashboard/revenue-by-month`, { headers }).then(r => r.json()),
      fetch(`${base}/api/dashboard/payment-methods`,  { headers }).then(r => r.json()),
    ]).then(([r, p]) => {
      setRevenue(Array.isArray(r) ? r : []);
      setPmData(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SectionSkeleton />;

  const totalIngresos  = revenue.reduce((s, m) => s + m.ingresos, 0);
  const totalTransac   = revenue.reduce((s, m) => s + m.solicitudes, 0);
  const mejorMes       = revenue.reduce((best, m) => m.ingresos > best.ingresos ? m : best, { mes: "-", ingresos: 0 });
  const ticketPromedio = totalTransac > 0 ? totalIngresos / totalTransac : 0;

  const lastTwo = revenue.slice(-2);
  const revTrend = lastTwo.length === 2 && lastTwo[0].ingresos > 0
    ? Math.round(((lastTwo[1].ingresos - lastTwo[0].ingresos) / lastTwo[0].ingresos) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Ingresos totales"  value={totalIngresos}   prefix="S/ " icon={TrendingUp}  color="bg-emerald-100 text-emerald-600"  trend={revTrend} decimals={0} />
        <KpiCard label="Transacciones"     value={totalTransac}               icon={CreditCard}   color="bg-blue-100 text-blue-600"        trend={15} />
        <KpiCard label="Ticket promedio"   value={ticketPromedio}  prefix="S/ " icon={FileText}     color="bg-violet-100 text-violet-600"   decimals={0} />
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">Mejor mes</span>
            <div className="text-3xl font-black text-slate-900">{mejorMes.mes || "—"}</div>
            <p className="text-xs text-slate-500 mt-1">S/ {mejorMes.ingresos.toLocaleString("es-PE")} generados</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Area Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">Ingresos mensuales</CardTitle>
            <CardDescription>Evolución del volumen transaccional en los últimos 6 meses</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => alert("Exportando PDF... (simulado)")}>
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => v === "ingresos" ? "Ingresos (S/)" : "Transacciones"} />
              <Area yAxisId="left"  type="monotone" dataKey="ingresos"    name="ingresos"    stroke="#2563eb" strokeWidth={2.5} fill="url(#gradRev)" dot={{ r: 4, fill: "#2563eb" }} activeDot={{ r: 6 }} />
              <Area yAxisId="right" type="monotone" dataKey="solicitudes" name="solicitudes" stroke="#16a34a" strokeWidth={2}   fill="url(#gradTx)"  dot={{ r: 3, fill: "#16a34a" }} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Métodos de pago</CardTitle>
            <CardDescription>Distribución por canal de pago</CardDescription>
          </CardHeader>
          <CardContent>
            {pmData.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pmData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {pmData.map((_, i) => <Cell key={i} fill={PM_COLORS[i % PM_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {pmData.map((d, i) => {
                    const pct = pmData.reduce((s, p) => s + p.count, 0);
                    return (
                      <div key={d.method} className="flex items-center gap-3">
                        <span className="text-lg">{PM_EMOJI[d.method] ?? "💳"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-700">{d.label}</span>
                            <span className="text-xs font-bold text-slate-500">{pct > 0 ? Math.round((d.count / pct) * 100) : 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct > 0 ? (d.count / pct) * 100 : 0}%`, backgroundColor: PM_COLORS[i % PM_COLORS.length] }} />
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                            <span>{d.count} pagos</span>
                            <span className="font-semibold text-slate-600">S/ {d.total.toLocaleString("es-PE")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly bars */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Comparativa mensual</CardTitle>
            <CardDescription>Ingresos mes a mes (S/ soles)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ingresos" name="ingresos" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {revenue.map((_, i) => (
                    <Cell key={i} fill={i === revenue.length - 1 ? "#2563eb" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── TÉCNICOS ─────────────────────────────────────────────────────────────────
type TechReport = {
  id: number; nombre: string; servicio: string; especialidad: string;
  rating: number; trabajosCompletados: number; trabajosPendientes: number;
  totalTrabajos: number; ingresos: number; disponible: boolean;
};

function TecnicosReport() {
  const [data,    setData]    = useState<TechReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fixya_auth_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    fetch(`${base}/api/dashboard/top-technicians`, { headers })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <SectionSkeleton />;

  const avgRating        = data.length > 0 ? data.reduce((s, t) => s + t.rating, 0) / data.length : 0;
  const totalCompletados = data.reduce((s, t) => s + t.trabajosCompletados, 0);
  const disponibles      = data.filter(t => t.disponible).length;
  const totalIngresos    = data.reduce((s, t) => s + t.ingresos, 0);

  const ratingData   = [...data].sort((a, b) => b.rating - a.rating).slice(0, 8).map(t => ({ name: t.nombre.split(" ")[0], rating: t.rating }));
  const ingresosData = [...data].sort((a, b) => b.ingresos - a.ingresos).slice(0, 8).map(t => ({ name: t.nombre.split(" ")[0], ingresos: t.ingresos }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Técnicos aprobados"   value={data.length}        icon={Wrench}       color="bg-blue-100 text-blue-600"    trend={12} />
        <KpiCard label="Disponibles ahora"    value={disponibles}        icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Rating promedio"       value={avgRating}          icon={Star}         color="bg-amber-100 text-amber-600"  suffix=" ★" decimals={2} />
        <KpiCard label="Ingresos generados"    value={totalIngresos}      prefix="S/ " icon={TrendingUp}   color="bg-violet-100 text-violet-600" trend={19} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Ranking por calificación</CardTitle>
            <CardDescription>Rating promedio (escala 1–5 ★)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ratingData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[4, 5]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={65} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rating" name="Rating ★" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {ratingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Ingresos generados</CardTitle>
            <CardDescription>Total facturado por técnico en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ingresosData} layout="vertical" margin={{ left: 10, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={65} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ingresos" name="ingresos" radius={[0, 6, 6, 0]} maxBarSize={20}>
                  {ingresosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Directorio de Técnicos</CardTitle>
            <CardDescription>Métricas de rendimiento individual</CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{data.length} técnicos</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  {["Técnico", "Categoría", "Rating", "Completados", "Pendientes", "Ingresos", "Estado"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.nombre}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[180px]">{t.especialidad}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">{t.servicio}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {t.rating.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{t.trabajosCompletados}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{t.trabajosPendientes}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">S/ {t.ingresos.toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        t.disponible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.disponible ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {t.disponible ? "Disponible" : "Ocupado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function AdminReports() {
  const [activeTab, setActiveTab] = useState<Tab>("servicios");

  return (
    <DashboardLayout title="Reportes y Análisis">
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <TabButton active={activeTab === "servicios"} onClick={() => setActiveTab("servicios")} icon={FileText}   label="Servicios" />
        <TabButton active={activeTab === "pagos"}     onClick={() => setActiveTab("pagos")}     icon={CreditCard} label="Pagos & Finanzas" />
        <TabButton active={activeTab === "tecnicos"}  onClick={() => setActiveTab("tecnicos")}  icon={Wrench}     label="Técnicos" />
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {activeTab === "servicios" && <ServiciosReport />}
        {activeTab === "pagos"     && <PagosReport />}
        {activeTab === "tecnicos"  && <TecnicosReport />}
      </motion.div>
    </DashboardLayout>
  );
}
