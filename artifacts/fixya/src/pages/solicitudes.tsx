import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { authJson } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, MapPin, User, Wrench, ChevronRight, CheckCircle, XCircle,
  PlayCircle, Ban, Navigation, Plus, Users, DollarSign, Radio
} from "lucide-react";
import { getServiceEmoji } from "@/lib/serviceIcon";

type ServiceRequest = {
  id: number;
  status: string;
  descripcion: string;
  direccion: string;
  fechaServicio: string;
  precioAcordado: number | null;
  trackingStatus: string | null;
  motivoCancelacion?: string | null;
  createdAt: string;
  offerCount?: number;
  myOffer?: { id: number; monto: number; status: string } | null;
  user?: { nombre: string; apellido: string } | null;
  technician?: { id: number; user?: { nombre: string; apellido: string } | null; service?: { nombre: string; icono?: string | null } | null } | null;
  service?: { nombre: string; icono?: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente",   className: "bg-amber-100 text-amber-800" },
  aceptada:    { label: "Aceptada",    className: "bg-blue-100 text-blue-800" },
  en_progreso: { label: "En Progreso", className: "bg-indigo-100 text-indigo-800" },
  completada:  { label: "Completada",  className: "bg-emerald-100 text-emerald-800" },
  cancelada:   { label: "Cancelada",   className: "bg-red-100 text-red-800" },
  rechazada:   { label: "Rechazada",   className: "bg-slate-100 text-slate-700" },
};

const STATUS_FILTERS = [
  { value: "", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "completada", label: "Completadas" },
];

function RejectModal({ id, onDone }: { id: number; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await authJson(`/api/requests/${id}/reject`, { method: "POST", body: JSON.stringify({ motivo }) });
      toast({ title: "Solicitud rechazada" });
      setOpen(false);
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <>
      <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setOpen(true)}>
        <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Rechazar solicitud</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea id="motivo" className="mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={loading}>
                {loading ? "Rechazando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OfferModal({ req, onDone }: { req: ServiceRequest; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState(req.myOffer ? String(req.myOffer.monto) : "");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authJson(`/api/requests/${req.id}/offer`, {
        method: "POST",
        body: JSON.stringify({ monto: parseFloat(monto), comentario }),
      });
      toast({ title: req.myOffer ? "Oferta actualizada" : "Oferta enviada" });
      setOpen(false);
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <>
      <Button size="sm" className={req.myOffer ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"} onClick={() => setOpen(true)}>
        <DollarSign className="w-3.5 h-3.5 mr-1" />
        {req.myOffer ? `Mi oferta: S/${req.myOffer.monto}` : "Hacer oferta"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{req.myOffer ? "Actualizar oferta" : "Enviar oferta"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="monto">Tu precio (S/) *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">S/</span>
                <Input id="monto" type="number" min={1} step={5} className="pl-9" value={monto}
                  onChange={(e) => setMonto(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Mensaje (opcional)</Label>
              <Textarea className="mt-1 min-h-[70px]"
                placeholder="Cuéntale al cliente cómo resolverás el problema..."
                value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Enviando..." : "Enviar oferta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestCard({ req, userRole, onAction, isBusy, onDone }: {
  req: ServiceRequest;
  userRole: string;
  onAction: (id: number, action: string) => void;
  isBusy: boolean;
  onDone: () => void;
}) {
  const st = STATUS_MAP[req.status] ?? { label: req.status, className: "" };

  return (
    <Card className="hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Tracking banner */}
      {req.trackingStatus && req.trackingStatus !== "completado" && (
        <div className="bg-blue-600 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-medium">
            {req.trackingStatus === "en_camino" && "Técnico en camino"}
            {req.trackingStatus === "llegando" && "Técnico llegando"}
            {req.trackingStatus === "en_sitio" && "Técnico en tu domicilio"}
          </span>
          <Link href={`/solicitudes/${req.id}`} className="ml-auto text-white/80 hover:text-white text-xs underline">
            Ver seguimiento →
          </Link>
        </div>
      )}

      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm">
                {getServiceEmoji(req.service?.icono ?? req.technician?.service?.icono)} {req.service?.nombre ?? req.technician?.service?.nombre ?? "Servicio"}
              </span>
              <Badge variant="outline" className={`border-0 shrink-0 text-xs ${st.className}`}>{st.label}</Badge>
              {req.precioAcordado && (
                <span className="font-bold text-blue-700 text-sm">S/ {req.precioAcordado.toFixed(2)}</span>
              )}
              {/* Offer count badge (client) */}
              {typeof req.offerCount === "number" && req.offerCount > 0 && req.status === "pendiente" && !req.technician && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                  <Users className="w-3 h-3" /> {req.offerCount} oferta{req.offerCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{req.descripcion}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                {new Date(req.fechaServicio).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="w-3 h-3 shrink-0" />{req.direccion}</span>
              {userRole !== "usuario" && req.user && (
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.user.nombre} {req.user.apellido}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            {/* Technician actions */}
            {userRole === "tecnico" && req.status === "pendiente" && req.technician && (
              <>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onAction(req.id, "accept")} disabled={isBusy}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aceptar
                </Button>
                <RejectModal id={req.id} onDone={onDone} />
              </>
            )}
            {userRole === "tecnico" && req.status === "aceptada" && req.technician && (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onAction(req.id, "complete")} disabled={isBusy}>
                <PlayCircle className="w-3.5 h-3.5 mr-1" /> Completar
              </Button>
            )}
            {/* Client cancel */}
            {userRole === "usuario" && req.status === "pendiente" && (
              <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => onAction(req.id, "cancel")} disabled={isBusy}>
                <Ban className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" asChild>
              <Link href={`/solicitudes/${req.id}`}>Ver <ChevronRight className="w-3.5 h-3.5 ml-0.5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PublicRequestCard({ req, onDone }: { req: ServiceRequest; onDone: () => void }) {
  const st = STATUS_MAP[req.status] ?? { label: req.status, className: "" };
  return (
    <Card className="hover:shadow-md transition-all duration-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">
              {getServiceEmoji(req.service?.icono)} {req.service?.nombre}
            </span>
            {req.precioAcordado && (
              <span className="text-sm font-bold text-green-700 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> S/ {req.precioAcordado.toFixed(2)} sugerido
              </span>
            )}
            {req.myOffer && (
              <Badge variant="outline" className="border-0 bg-amber-100 text-amber-800 text-xs">
                {req.myOffer.status === "pendiente" ? `Mi oferta: S/${req.myOffer.monto}` : req.myOffer.status === "aceptada" ? "✓ Oferta aceptada" : "Oferta no seleccionada"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-600 line-clamp-2">{req.descripcion}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
              {new Date(req.fechaServicio).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
            </span>
            <span className="flex items-center gap-1 truncate max-w-[180px]"><MapPin className="w-3 h-3 shrink-0" />{req.direccion}</span>
            {typeof req.offerCount === "number" && (
              <span className="flex items-center gap-1 text-blue-500">
                <Users className="w-3 h-3" /> {req.offerCount} oferta{req.offerCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {(!req.myOffer || req.myOffer.status === "pendiente") && (
            <OfferModal req={req} onDone={onDone} />
          )}
          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" asChild>
            <Link href={`/solicitudes/${req.id}`}>Detalles <ChevronRight className="w-3.5 h-3.5 ml-0.5" /></Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function SolicitudesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [publicRequests, setPublicRequests] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [publicTotal, setPublicTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [publicPage, setPublicPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const LIMIT = 10;

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filter) params.set("status", filter);
      const data = await authJson<{ requests: ServiceRequest[]; total: number }>(`/api/requests?${params}`);
      setRequests(data.requests);
      setTotal(data.total);
    } catch { setRequests([]); } finally { setLoading(false); }
  }, [page, filter]);

  const fetchPublic = useCallback(async () => {
    if (user?.role !== "tecnico") return;
    setLoadingPublic(true);
    try {
      const params = new URLSearchParams({ page: String(publicPage), limit: String(LIMIT) });
      const data = await authJson<{ requests: ServiceRequest[]; total: number }>(`/api/requests/public?${params}`);
      setPublicRequests(data.requests);
      setPublicTotal(data.total);
    } catch { setPublicRequests([]); } finally { setLoadingPublic(false); }
  }, [publicPage, user?.role]);

  useEffect(() => { fetchMine(); }, [fetchMine]);
  useEffect(() => { if (tab === "public") fetchPublic(); }, [tab, fetchPublic]);

  const doAction = async (id: number, action: string) => {
    setActionLoading(id);
    try {
      await authJson(`/api/requests/${id}/${action}`, { method: "POST" });
      toast({ title: "Estado actualizado" });
      fetchMine();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setActionLoading(null); }
  };

  const isTech = user?.role === "tecnico";
  const isClient = user?.role === "usuario";
  const title = isTech ? "Mis Trabajos" : user?.role === "administrador" ? "Todas las Solicitudes" : "Mis Solicitudes";
  const totalPages = Math.ceil(total / LIMIT);
  const publicTotalPages = Math.ceil(publicTotal / LIMIT);

  return (
    <DashboardLayout title={title}>
      {/* Tabs for technicians */}
      {isTech && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
          <button
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "mine" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Mis Trabajos
          </button>
          <button
            onClick={() => setTab("public")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === "public" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Solicitudes Abiertas
          </button>
        </div>
      )}

      {/* Client: new request button */}
      {isClient && (
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.value ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => navigate("/nueva-solicitud")}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Solicitud
          </Button>
        </div>
      )}

      {/* Admin filter */}
      {user?.role === "administrador" && (
        <div className="flex gap-2 flex-wrap mb-5">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>{f.label}
            </button>
          ))}
        </div>
      )}

      {/* MY REQUESTS TAB */}
      {tab === "mine" && (
        <>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No hay solicitudes{filter ? ` con ese estado` : ""}.</p>
              {isClient && (
                <Button className="mt-4" onClick={() => navigate("/nueva-solicitud")}>
                  <Plus className="w-4 h-4 mr-2" /> Crear primera solicitud
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  userRole={user?.role ?? ""}
                  onAction={doAction}
                  isBusy={actionLoading === req.id}
                  onDone={fetchMine}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="px-4 py-2 text-sm text-slate-600">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}

      {/* PUBLIC REQUESTS TAB (technicians) */}
      {tab === "public" && isTech && (
        <>
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex items-start gap-2">
            <Radio className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Solicitudes abiertas de clientes esperando técnicos. Envía una oferta con tu precio y el cliente elegirá.</span>
          </div>
          {loadingPublic ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
          ) : publicRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <Radio className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No hay solicitudes abiertas en este momento.</p>
              <p className="text-slate-400 text-xs mt-1">Vuelve pronto — los clientes publican solicitudes constantemente.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {publicRequests.map((req) => (
                <PublicRequestCard key={req.id} req={req} onDone={fetchPublic} />
              ))}
            </div>
          )}
          {publicTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="sm" disabled={publicPage === 1} onClick={() => setPublicPage(p => p - 1)}>Anterior</Button>
              <span className="px-4 py-2 text-sm text-slate-600">Página {publicPage} de {publicTotalPages}</span>
              <Button variant="outline" size="sm" disabled={publicPage === publicTotalPages} onClick={() => setPublicPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
