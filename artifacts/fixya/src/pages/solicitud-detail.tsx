import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { authJson } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TrackingView } from "@/components/TrackingView";
import { PaymentModal } from "@/components/PaymentModal";
import {
  ChevronLeft, Star, Clock, MapPin, Wrench,
  CheckCircle, XCircle, DollarSign, MessageSquare, Users, CreditCard,
} from "lucide-react";
import { getServiceEmoji } from "@/lib/serviceIcon";

type Offer = {
  id: number;
  monto: number;
  comentario: string | null;
  status: string;
  createdAt: string;
  technician: {
    id: number;
    especialidad: string;
    promedioCalificacion: number;
    totalTrabajos: number;
    user?: { nombre: string; apellido: string; avatarUrl?: string | null } | null;
    service?: { nombre: string } | null;
  } | null;
};

type RequestDetail = {
  id: number;
  status: string;
  descripcion: string;
  direccion: string;
  fechaServicio: string;
  precioAcordado: number | null;
  trackingStatus: string | null;
  etaMinutos: number | null;
  technicianId: number | null;
  createdAt: string;
  offers?: Offer[];
  user?: { nombre: string; apellido: string } | null;
  technician?: any;
  service?: { nombre: string; icono?: string | null } | null;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendiente:   { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
  aceptada:    { label: "Aceptada",  className: "bg-blue-100 text-blue-800" },
  en_progreso: { label: "En Progreso", className: "bg-indigo-100 text-indigo-800" },
  completada:  { label: "Completada", className: "bg-emerald-100 text-emerald-800" },
  cancelada:   { label: "Cancelada", className: "bg-red-100 text-red-800" },
  rechazada:   { label: "Rechazada", className: "bg-slate-100 text-slate-700" },
};

function OfferCard({ offer, onAccept, canAccept, accepting }: {
  offer: Offer;
  onAccept: (id: number) => void;
  canAccept: boolean;
  accepting: boolean;
}) {
  const tech = offer.technician;
  const techName = tech?.user ? `${tech.user.nombre} ${tech.user.apellido}` : "Técnico";
  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${
      offer.status === "aceptada"
        ? "border-emerald-300 bg-emerald-50"
        : offer.status === "rechazada"
        ? "border-slate-200 bg-slate-50 opacity-60"
        : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
    }`}>
      <div className="flex items-start gap-3">
        <img
          src={tech?.user?.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(techName)}&background=2563eb&color=fff&size=56`}
          alt={techName}
          className="w-12 h-12 rounded-full border-2 border-blue-100 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900 text-sm">{techName}</p>
              <p className="text-blue-600 text-xs">{tech?.service?.nombre}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-slate-900">S/ {offer.monto.toFixed(2)}</p>
              {offer.status === "aceptada" && <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Aceptada</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              {tech?.promedioCalificacion?.toFixed(1) ?? "0.0"}
            </span>
            <span>{tech?.totalTrabajos ?? 0} trabajos</span>
          </div>
          {offer.comentario && (
            <div className="mt-2 bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 flex items-start gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              {offer.comentario}
            </div>
          )}
          {canAccept && offer.status === "pendiente" && (
            <Button
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm rounded-xl"
              onClick={() => onAccept(offer.id)}
              disabled={accepting}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Aceptar esta oferta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MakeOfferDialog({ requestId, existingOffer, onDone }: {
  requestId: number;
  existingOffer?: Offer | null;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [monto, setMonto] = useState(existingOffer ? String(existingOffer.monto) : "");
  const [comentario, setComentario] = useState(existingOffer?.comentario ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) {
      toast({ title: "Ingresa un monto válido", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authJson(`/api/requests/${requestId}/offer`, {
        method: "POST",
        body: JSON.stringify({ monto: parseFloat(monto), comentario }),
      });
      toast({ title: existingOffer ? "Oferta actualizada" : "Oferta enviada", description: "El cliente verá tu oferta y podrá aceptarla." });
      setOpen(false);
      onDone();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-semibold"
        onClick={() => setOpen(true)}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        {existingOffer ? "Actualizar oferta" : "Enviar oferta de precio"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{existingOffer ? "Actualizar oferta" : "Enviar oferta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="monto">Tu precio (S/) *</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">S/</span>
                <Input
                  id="monto"
                  type="number"
                  min={1}
                  step={5}
                  className="pl-9"
                  placeholder="150"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="comentario">Mensaje al cliente (opcional)</Label>
              <Textarea
                id="comentario"
                className="mt-1 min-h-[80px]"
                placeholder="Cuéntale al cliente cómo vas a resolver el problema, tu disponibilidad, etc."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
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

export function SolicitudDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = parseInt(id ?? "0");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const data = await authJson<RequestDetail>(`/api/requests/${requestId}`);
      setRequest(data);
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
    // Auto-refresh every 15 seconds when tracking is active
    const interval = setInterval(() => {
      if (request?.trackingStatus && request.trackingStatus !== "completado") {
        fetchRequest();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRequest, request?.trackingStatus]);

  const acceptOffer = async (offerId: number) => {
    setAccepting(true);
    try {
      await authJson(`/api/requests/${requestId}/accept-offer`, {
        method: "POST",
        body: JSON.stringify({ offerId }),
      });
      toast({ title: "¡Oferta aceptada!", description: "El técnico está en camino a tu domicilio." });
      fetchRequest();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Solicitud no encontrada.</p>
          <Button asChild variant="outline"><Link href="/solicitudes">Volver</Link></Button>
        </div>
      </div>
    );
  }

  const st = STATUS_MAP[request.status] ?? { label: request.status, className: "" };
  const isClient = user?.role === "usuario" || user?.role === "administrador";
  const isTech = user?.role === "tecnico";
  const hasTracking = !!request.trackingStatus;
  const offers = request.offers ?? [];
  const pendingOffers = offers.filter((o) => o.status === "pendiente");
  const myOffer = isTech ? null : null; // technician's own offer (loaded from request)

  // For technicians: find their own offer
  const techOffer = isTech ? offers[0] ?? null : null; // simplified — show first

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/solicitudes")} className="text-slate-500 hover:text-slate-900 p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-900 truncate">Solicitud #{request.id}</h1>
            <p className="text-xs text-slate-500">{request.service?.nombre}</p>
          </div>
          <Badge variant="outline" className={`border-0 shrink-0 ${st.className}`}>{st.label}</Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Request summary */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getServiceEmoji(request.service?.icono)}</span>
              <div>
                <p className="font-bold text-slate-900">{request.service?.nombre}</p>
                {request.precioAcordado && (
                  <p className="text-blue-700 font-semibold text-sm">S/ {request.precioAcordado.toFixed(2)}</p>
                )}
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{request.descripcion}</p>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {request.direccion}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {new Date(request.fechaServicio).toLocaleDateString("es-PE", {
                  weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tracking (active requests) */}
        {hasTracking && request.technician && (
          <div>
            <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              Seguimiento en tiempo real
            </h2>
            <TrackingView
              request={{
                id: request.id,
                trackingStatus: request.trackingStatus as any,
                etaMinutos: request.etaMinutos,
                direccion: request.direccion,
                technician: request.technician,
              }}
              onRefresh={fetchRequest}
            />
          </div>
        )}

        {/* Client: pay now banner (status = aceptada) */}
        {isClient && request.status === "aceptada" && request.precioAcordado && !hasTracking && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">¡Oferta aceptada!</p>
                <p className="text-blue-100 text-sm mt-0.5">Realiza el pago para que el técnico comience el trabajo.</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-bold">
                    S/ {request.precioAcordado.toFixed(2)}
                  </span>
                  <span className="text-blue-200 text-xs">
                    {request.technician?.user
                      ? `${request.technician.user.nombre} ${request.technician.user.apellido}`
                      : "Técnico asignado"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 h-11 font-bold rounded-xl"
              onClick={() => setShowPayment(true)}
            >
              💳 Pagar ahora · S/ {request.precioAcordado.toFixed(2)}
            </Button>
          </div>
        )}

        {/* Client: offers received */}
        {isClient && request.status === "pendiente" && !request.technicianId && (
          <div>
            <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Ofertas recibidas
              {pendingOffers.length > 0 && (
                <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingOffers.length}
                </span>
              )}
            </h2>
            {offers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-500 font-medium text-sm">Esperando ofertas...</p>
                <p className="text-slate-400 text-xs mt-1">Los técnicos disponibles verán tu solicitud y enviarán sus propuestas de precio.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onAccept={acceptOffer}
                    canAccept={isClient && request.status === "pendiente"}
                    accepting={accepting}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Technician: make/update offer */}
        {isTech && request.status === "pendiente" && !request.technicianId && (
          <div>
            <h2 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Tu oferta
            </h2>
            {techOffer && techOffer.status !== "pendiente" ? (
              <div className={`rounded-2xl p-4 text-center border-2 ${
                techOffer.status === "aceptada" ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"
              }`}>
                {techOffer.status === "aceptada" ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-emerald-800">¡Tu oferta fue aceptada!</p>
                    <p className="text-emerald-600 text-sm">S/ {techOffer.monto.toFixed(2)}</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">Oferta no seleccionada</p>
                    <p className="text-slate-500 text-sm">El cliente eligió otro técnico.</p>
                  </>
                )}
              </div>
            ) : (
              <MakeOfferDialog
                requestId={request.id}
                existingOffer={techOffer}
                onDone={fetchRequest}
              />
            )}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPayment && request.precioAcordado && (
        <PaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          requestId={request.id}
          monto={request.precioAcordado}
          servicioNombre={request.service?.nombre ?? "Servicio"}
          tecnicoNombre={
            request.technician?.user
              ? `${request.technician.user.nombre} ${request.technician.user.apellido}`
              : "Técnico asignado"
          }
          onSuccess={fetchRequest}
        />
      )}
    </div>
  );
}

// Fix: missing import
function Navigation({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polygon points="3,11 22,2 13,21 11,13 3,11" />
    </svg>
  );
}
