import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetTechnicianDashboardSummary, getGetTechnicianDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Star, Briefcase, Clock, ArrowRight, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";

export function TechnicianDashboard() {
  const { data: summary, isLoading } = useGetTechnicianDashboardSummary({
    query: { queryKey: getGetTechnicianDashboardSummaryQueryKey() }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Panel de Técnico">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardLayout>
    );
  }

  const stars = Math.round(summary?.promedioCalificacion ?? 0);

  return (
    <DashboardLayout title="Panel de Técnico">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Ingresos - featured card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.4 }}>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Ingresos del Mes</CardTitle>
              <Banknote className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">S/ {(summary?.ingresosMes || 0).toLocaleString("es-PE")}</div>
              <p className="text-xs text-blue-200 mt-1">
                Histórico: <span className="font-semibold text-white">S/ {(summary?.ingresosTotales || 0).toLocaleString("es-PE")}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }}>
          <Card className="bg-amber-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trabajos Activos</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-700">{summary?.solicitudesActivas || 0}</div>
              <p className="text-xs text-slate-400 mt-1">{summary?.solicitudesPendientes || 0} pendientes de respuesta</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }}>
          <Card className="bg-emerald-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completados</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-700">{summary?.trabajosCompletados || 0}</div>
              <p className="text-xs text-slate-400 mt-1">trabajos finalizados</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }}>
          <Card className="bg-amber-50 border-0 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Calificación</CardTitle>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500 fill-current" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-700">{summary?.promedioCalificacion?.toFixed(1) || "0.0"}</div>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={`w-3 h-3 ${n <= stars ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick action banner if there are pending requests */}
      {(summary?.solicitudesPendientes ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-violet-900">
                {summary?.solicitudesPendientes} solicitud(es) esperando tu oferta
              </p>
              <p className="text-xs text-violet-500">Responde rápido para aumentar tu tasa de conversión</p>
            </div>
          </div>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link href="/solicitudes">Responder</Link>
          </Button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Trabajos Recientes</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/solicitudes">Ver Todos</Link>
        </Button>
      </div>

      <Card>
        <div className="divide-y">
          {!summary?.recentRequests || summary.recentRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <p className="text-slate-500 mb-4">No tienes trabajos recientes asignados.</p>
              <Button asChild>
                <Link href="/solicitudes">Buscar Solicitudes</Link>
              </Button>
            </div>
          ) : (
            summary.recentRequests.map((req, i) => (
              <motion.div key={req.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-900">
                        {req.user?.nombre} {req.user?.apellido}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{req.direccion}</p>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {formatDate(req.fechaServicio)}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/solicitudes/${req.id}`} className="flex items-center gap-1">
                    {req.status === "pendiente" ? "Enviar oferta" : "Ver detalles"}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
