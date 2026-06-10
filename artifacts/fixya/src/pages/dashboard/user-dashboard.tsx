import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetUserDashboardSummary, getGetUserDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, CreditCard, ArrowRight, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";

export function UserDashboard() {
  const { data: summary, isLoading } = useGetUserDashboardSummary({
    query: { queryKey: getGetUserDashboardSummaryQueryKey() }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Mi Resumen">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </DashboardLayout>
    );
  }

  const kpis = [
    {
      label: "Solicitudes Totales",
      value: summary?.totalSolicitudes || 0,
      icon: FileText,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100 text-blue-600",
      valueColor: "text-blue-700",
    },
    {
      label: "Solicitudes Activas",
      value: summary?.solicitudesActivas || 0,
      icon: Clock,
      bg: "bg-amber-50",
      iconBg: "bg-amber-100 text-amber-600",
      valueColor: "text-amber-700",
    },
    {
      label: "Trabajos Completados",
      value: summary?.solicitudesCompletadas || 0,
      icon: CheckCircle,
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100 text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      label: "Total Invertido",
      value: `S/ ${(summary?.totalGastado || 0).toLocaleString("es-PE", { minimumFractionDigits: 0 })}`,
      icon: CreditCard,
      bg: "bg-violet-50",
      iconBg: "bg-violet-100 text-violet-600",
      valueColor: "text-violet-700",
    },
  ];

  return (
    <DashboardLayout title="Mi Resumen">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}>
            <Card className={`border-0 ${kpi.bg} hover:shadow-md transition-shadow duration-200`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {kpi.label}
                </CardTitle>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-black ${kpi.valueColor}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Solicitudes Recientes</h2>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="/nueva-solicitud" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Nueva
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/solicitudes">Ver Todas</Link>
          </Button>
        </div>
      </div>

      <Card>
        <div className="divide-y">
          {!summary?.recentRequests || summary.recentRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <p className="text-slate-500 mb-4">Todavía no tienes solicitudes.</p>
              <Button asChild>
                <Link href="/servicios" className="flex items-center gap-2">
                  Buscar Servicios <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            summary.recentRequests.map((req, i) => (
              <motion.div key={req.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-lg">
                    🔧
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-900">{req.service?.nombre}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{req.descripcion}</p>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {formatDate(req.fechaServicio)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {req.precioAcordado && (
                    <span className="font-bold text-slate-800">
                      S/ {parseFloat(String(req.precioAcordado)).toLocaleString("es-PE")}
                    </span>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/solicitudes/${req.id}`} className="flex items-center gap-1">
                      Ver <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
