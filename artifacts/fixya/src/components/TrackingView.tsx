import { useState, useEffect, useCallback } from "react";
import { authJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, MapPin, Clock, CheckCircle, Navigation, Home, Wrench } from "lucide-react";

type TrackingStatus = "en_camino" | "llegando" | "en_sitio" | "completado" | null;

interface TrackingRequest {
  id: number;
  trackingStatus: TrackingStatus;
  etaMinutos: number | null;
  direccion: string;
  technician: {
    id: number;
    especialidad: string;
    promedioCalificacion: number;
    user?: { nombre: string; apellido: string; telefono?: string | null; avatarUrl?: string | null } | null;
    service?: { nombre: string } | null;
  } | null;
}

interface Props {
  request: TrackingRequest;
  onRefresh: () => void;
}

const LIMA_WAYPOINTS = [
  "Villa El Salvador", "San Juan de Miraflores", "Chorrillos", "Barranco",
  "Miraflores", "San Isidro", "Lince", "Jesús María",
  "Pueblo Libre", "Magdalena", "San Miguel", "Callao",
  "Los Olivos", "San Martín de Porres", "Independencia", "Comas",
  "Ate", "Santa Anita", "El Agustino", "San Borja",
];

const STATUS_CONFIG = {
  en_camino: {
    label: "Técnico en camino",
    sublabel: "Tu técnico ha salido y se dirige hacia ti",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    progress: 33,
  },
  llegando: {
    label: "¡Está llegando!",
    sublabel: "Tu técnico está a pocos minutos de tu domicilio",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    progress: 66,
  },
  en_sitio: {
    label: "Técnico en tu domicilio",
    sublabel: "El técnico ha llegado y está listo para trabajar",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    progress: 90,
  },
  completado: {
    label: "Servicio completado",
    sublabel: "El trabajo ha sido completado exitosamente",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
    progress: 100,
  },
};

export function TrackingView({ request, onRefresh }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eta, setEta] = useState(request.etaMinutos ?? 20);
  const [techLocation, setTechLocation] = useState(() => {
    const idx = Math.floor(Math.random() * LIMA_WAYPOINTS.length);
    return LIMA_WAYPOINTS[idx];
  });
  const [dotPosition, setDotPosition] = useState(5);
  const [updating, setUpdating] = useState(false);

  const status = request.trackingStatus ?? "en_camino";
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.en_camino;

  // Simulate ETA countdown
  useEffect(() => {
    if (status === "completado" || status === "en_sitio") return;
    const interval = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1));
      setDotPosition((prev) => Math.min(90, prev + 1.5));
      // Slowly change district
      if (Math.random() < 0.15) {
        const idx = Math.floor(Math.random() * LIMA_WAYPOINTS.length);
        setTechLocation(LIMA_WAYPOINTS[idx]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [status]);

  const updateTracking = useCallback(async (newStatus: string) => {
    setUpdating(true);
    try {
      const etaVal = newStatus === "llegando" ? 5 : newStatus === "en_sitio" ? 0 : undefined;
      await authJson(`/api/requests/${request.id}/tracking`, {
        method: "PATCH",
        body: JSON.stringify({ trackingStatus: newStatus, ...(etaVal !== undefined && { etaMinutos: etaVal }) }),
      });
      toast({ title: "Estado actualizado" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  }, [request.id, onRefresh, toast]);

  const tech = request.technician;
  const techName = tech?.user ? `${tech.user.nombre} ${tech.user.apellido}` : "Técnico";

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-2xl border-2 p-4 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${cfg.dot} ${status !== "completado" && status !== "en_sitio" ? "animate-pulse" : ""}`} />
          <div>
            <p className={`font-bold text-base ${cfg.color}`}>{cfg.label}</p>
            <p className="text-slate-500 text-xs">{cfg.sublabel}</p>
          </div>
          {status !== "completado" && status !== "en_sitio" && (
            <div className="ml-auto text-right">
              <p className={`text-2xl font-bold ${cfg.color}`}>{eta}</p>
              <p className="text-slate-400 text-xs">minutos</p>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${cfg.dot}`}
            style={{ width: `${cfg.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>Origen</span>
          <span>En camino</span>
          <span>Llegando</span>
          <span>En sitio</span>
        </div>
      </div>

      {/* Map simulation */}
      {status !== "completado" && status !== "en_sitio" && (
        <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden relative">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <p className="text-white/40 text-xs mb-3 relative z-10">Ubicación del técnico (simulada)</p>

          {/* Route line */}
          <div className="relative h-16 flex items-center">
            {/* Route path */}
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-blue-500/30 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-6 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-4000"
              style={{ width: `calc(${dotPosition}% - 24px)` }}
            />
            {/* Technician dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-4000 z-10"
              style={{ left: `calc(${dotPosition}% + 8px)` }}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -inset-1 bg-blue-400/30 rounded-full animate-ping" />
              </div>
            </div>
            {/* Origin */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
              </div>
            </div>
            {/* Destination */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Home className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-between text-xs mt-2">
            <span className="text-white/50">{techLocation}</span>
            <span className="text-emerald-400 font-medium truncate max-w-[50%] text-right">{request.direccion.split(",")[0]}</span>
          </div>
        </div>
      )}

      {/* Technician card */}
      {tech && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <img
              src={tech.user?.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(techName)}&background=2563eb&color=fff&size=80`}
              alt={techName}
              className="w-14 h-14 rounded-full border-2 border-blue-100"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">{techName}</p>
              <p className="text-blue-600 text-sm">{tech.service?.nombre} · {tech.especialidad}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold">{tech.promedioCalificacion.toFixed(1)}</span>
                </span>
                {tech.user?.telefono && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    {tech.user.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">{request.direccion}</span>
          </div>
        </div>
      )}

      {/* Technician action buttons */}
      {user?.role === "tecnico" && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-medium text-slate-700 mb-3">Actualiza tu estado</p>
          {status === "en_camino" && (
            <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => updateTracking("llegando")} disabled={updating}>
              <Navigation className="w-4 h-4 mr-2" /> Estoy llegando (5 min)
            </Button>
          )}
          {(status === "en_camino" || status === "llegando") && (
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => updateTracking("en_sitio")} disabled={updating}>
              <CheckCircle className="w-4 h-4 mr-2" /> Llegué al domicilio
            </Button>
          )}
          {status === "en_sitio" && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => updateTracking("completado")} disabled={updating}>
              <Wrench className="w-4 h-4 mr-2" /> Marcar trabajo como completado
            </Button>
          )}
        </div>
      )}

      {/* Completado */}
      {status === "completado" && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-emerald-800 text-lg">¡Servicio completado!</p>
          <p className="text-emerald-600 text-sm mt-1">El trabajo fue realizado exitosamente.</p>
        </div>
      )}
    </div>
  );
}
