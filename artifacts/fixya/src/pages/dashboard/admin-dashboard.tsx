import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Wrench, FileText, TrendingUp, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  pendiente:   "#f59e0b",
  aceptada:    "#3b82f6",
  en_progreso: "#8b5cf6",
  completada:  "#10b981",
  cancelada:   "#ef4444",
  rechazada:   "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente:   "Pendiente",
  aceptada:    "Aceptada",
  en_progreso: "En Progreso",
  completada:  "Completada",
  cancelada:   "Cancelada",
  rechazada:   "Rechazada",
};

type RevenueMonth = { mes: string; ingresos: number; solicitudes: number };
type StatusCount  = { status: string; count: number };
type ActivityItem = { id: number; status: string; precioAcordado: number | null; usuario: string; servicio: string };

export function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const [revenue, setRevenue]     = useState<RevenueMonth[]>([]);
  const [byStatus, setByStatus]   = useState<StatusCount[]>([]);
  const [activity, setActivity]   = useState<ActivityItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("fixya_auth_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const authFetch = (path: string) =>
      fetch(`${base}${path}`, { headers })
        .then((r) => r.json())
        .catch(() => []);

    authFetch("/api/dashboard/revenue-by-month").then((d) => Array.isArray(d) && setRevenue(d));
    authFetch("/api/dashboard/requests-by-status").then((d) => Array.isArray(d) && setByStatus(d));
    authFetch("/api/dashboard/recent-activity").then((d) => Array.isArray(d) && setActivity(d));
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Panel Administrativo">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const statusData = byStatus.filter(d => d.count > 0);
  const totalReqs  = statusData.reduce((s, d) => s + d.count, 0);

  return (
    <DashboardLayout title="Panel Administrativo">

      {summary?.tecnicosPendienteAprobacion && summary.tecnicosPendienteAprobacion > 0 ? (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Hay {summary.tecnicosPendienteAprobacion} técnico(s) esperando aprobación.
            </span>
          </div>
          <Button size="sm" variant="outline" className="bg-white" asChild>
            <Link href="/admin/tecnicos">Revisar</Link>
          </Button>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalUsuarios || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Registrados en la plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Técnicos Aprobados</CardTitle>
            <Wrench className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalTecnicos || 0}</div>
            <p className="text-xs text-slate-500 mt-1">En activo en la plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes Totales</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalSolicitudes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-amber-600 font-semibold">{summary?.solicitudesPendientes || 0}</span> pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Volumen Transaccional</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              S/ {(summary?.ingresosTotales || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              S/ {(summary?.ingresosMes || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })} este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos Mensuales</CardTitle>
            <CardDescription>Evolución del volumen transaccional (S/ soles)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `S/${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`S/ ${v.toFixed(2)}`, "Ingresos"]} />
                <Area type="monotone" dataKey="ingresos" stroke="#2563eb" strokeWidth={2.5} fill="url(#gradIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de Solicitudes</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusData} dataKey="count" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, _n, props) => [v, STATUS_LABELS[props.payload.status] ?? props.payload.status]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {statusData.map((d) => (
                <div key={d.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] }} />
                    <span className="text-muted-foreground">{STATUS_LABELS[d.status]}</span>
                  </div>
                  <span className="font-semibold">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas solicitudes de la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{a.usuario}</p>
                    <p className="text-xs text-muted-foreground">{a.servicio}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs mt-0.5 ml-2 shrink-0"
                    style={{ backgroundColor: `${STATUS_COLORS[a.status]}20`, color: STATUS_COLORS[a.status] }}
                  >
                    {STATUS_LABELS[a.status]}
                  </Badge>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Sin actividad reciente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            <CardDescription>Gestión y reportes de la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3" asChild>
              <Link href="/admin/reportes">
                <TrendingUp className="h-4 w-4" />
                Ver Reportes y Gráficos Completos
              </Link>
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" asChild>
              <Link href="/admin/usuarios">
                <Users className="h-4 w-4" />
                Gestionar Usuarios
              </Link>
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" asChild>
              <Link href="/admin/tecnicos">
                <Wrench className="h-4 w-4" />
                Aprobar Técnicos
              </Link>
            </Button>
            <Button className="w-full justify-start gap-3" variant="outline" asChild>
              <Link href="/solicitudes">
                <FileText className="h-4 w-4" />
                Todas las Solicitudes
              </Link>
            </Button>

            <div className="pt-2 border-t grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Usuarios",    value: summary?.totalUsuarios ?? 0 },
                { label: "Técnicos",    value: summary?.totalTecnicos ?? 0 },
                { label: "Completadas", value: statusData.find(s => s.status === "completada")?.count ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-muted/40 rounded-lg p-3">
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
