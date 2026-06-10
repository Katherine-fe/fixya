import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { authJson } from "@/lib/api";
import { getServiceEmoji } from "@/lib/serviceIcon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Search, CheckCircle, XCircle, Clock, Star } from "lucide-react";

type Technician = {
  id: number;
  especialidad: string;
  status: string;
  experienciaAnios: number;
  precioHora: number;
  promedioCalificacion: number;
  totalTrabajos: number;
  createdAt?: string;
  user?: { nombre: string; apellido: string; email: string; avatarUrl?: string | null } | null;
  service?: { nombre: string; icono?: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente",  className: "bg-amber-100 text-amber-800",   icon: <Clock className="w-3.5 h-3.5" /> },
  aprobado:  { label: "Aprobado",   className: "bg-emerald-100 text-emerald-800", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rechazado: { label: "Rechazado",  className: "bg-red-100 text-red-800",       icon: <XCircle className="w-3.5 h-3.5" /> },
};

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
];

export function AdminTecnicosPage() {
  const { toast } = useToast();
  const [techs, setTechs] = useState<Technician[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pendiente");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actioning, setActioning] = useState<number | null>(null);
  const LIMIT = 12;

  const fetchTechs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) params.set("status", statusFilter);
      const data = await authJson<{ technicians: Technician[]; total: number }>(`/api/technicians?${params}`);
      setTechs(data.technicians);
      setTotal(data.total);
    } catch {
      setTechs([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTechs(); }, [fetchTechs]);

  const doAction = async (id: number, action: "approve" | "reject") => {
    setActioning(id);
    try {
      await authJson(`/api/technicians/${id}/${action}`, { method: "POST" });
      toast({ title: action === "approve" ? "Técnico aprobado" : "Técnico rechazado" });
      fetchTechs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActioning(null);
    }
  };

  const filtered = search
    ? techs.filter(t =>
        `${t.user?.nombre} ${t.user?.apellido} ${t.especialidad} ${t.service?.nombre}`
          .toLowerCase().includes(search.toLowerCase())
      )
    : techs;

  const totalPages = Math.ceil(total / LIMIT);
  const pendingCount = statusFilter === "pendiente" ? total : 0;

  return (
    <DashboardLayout title="Gestión de Técnicos">
      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
          <Clock className="w-4 h-4 shrink-0" />
          <span><strong>{pendingCount} técnico{pendingCount !== 1 ? "s" : ""}</strong> esperando aprobación.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o especialidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No hay técnicos {statusFilter ? `con estado "${STATUS_CONFIG[statusFilter]?.label}"` : "registrados"}.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const st = STATUS_CONFIG[t.status] ?? { label: t.status, className: "", icon: null };
            const techName = `${t.user?.nombre ?? ""} ${t.user?.apellido ?? ""}`.trim();
            const isBusy = actioning === t.id;
            return (
              <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <img
                    src={t.user?.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(techName)}&background=2563eb&color=fff&size=48`}
                    alt={techName}
                    className="w-12 h-12 rounded-full border-2 border-blue-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-slate-900">{techName}</span>
                      <Badge variant="outline" className={`border-0 text-xs flex items-center gap-1 ${st.className}`}>
                        {st.icon} {st.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{getServiceEmoji(t.service?.icono)} {t.service?.nombre}</p>
                    <p className="text-sm text-slate-500 truncate">{t.especialidad}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span>{t.experienciaAnios} años exp.</span>
                      <span>S/ {typeof t.precioHora === "number" ? t.precioHora.toFixed(0) : t.precioHora}/hr</span>
                      {t.totalTrabajos > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          {typeof t.promedioCalificacion === "number" ? t.promedioCalificacion.toFixed(1) : t.promedioCalificacion}
                          <span className="ml-0.5">({t.totalTrabajos})</span>
                        </span>
                      )}
                      <span className="text-slate-400">{t.user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/tecnicos/${t.id}`}>Ver perfil</Link>
                  </Button>
                  {t.status === "pendiente" && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => doAction(t.id, "approve")}
                        disabled={isBusy}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => doAction(t.id, "reject")}
                        disabled={isBusy}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                      </Button>
                    </>
                  )}
                  {t.status === "rechazado" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => doAction(t.id, "approve")}
                      disabled={isBusy}
                    >
                      Aprobar ahora
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
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
