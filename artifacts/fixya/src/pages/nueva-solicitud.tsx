import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { authJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, DollarSign, ArrowRight, ChevronLeft, Users, CheckCircle, Sparkles } from "lucide-react";

type Service = { id: number; nombre: string; descripcion: string | null; icono: string | null; precioBase?: string };

// Service illustration components — one per category
function IlluPlomeria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#dbeafe" />
      {/* Pipe horizontal */}
      <rect x="10" y="34" width="30" height="12" rx="6" fill="#3b82f6" />
      {/* Pipe vertical */}
      <rect x="34" y="10" width="12" height="30" rx="6" fill="#2563eb" />
      {/* Elbow joint */}
      <circle cx="40" cy="40" r="8" fill="#1d4ed8" />
      {/* Droplets */}
      <ellipse cx="22" cy="55" rx="4" ry="5" fill="#60a5fa" />
      <ellipse cx="32" cy="62" rx="3" ry="4" fill="#93c5fd" />
      {/* Wrench */}
      <rect x="48" y="38" width="20" height="6" rx="3" fill="#1e40af" transform="rotate(-45 48 38)" />
    </svg>
  );
}

function IlluElectricidad({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#fef3c7" />
      {/* Bulb */}
      <ellipse cx="40" cy="32" rx="14" ry="16" fill="#fbbf24" />
      <rect x="33" y="46" width="14" height="8" rx="2" fill="#f59e0b" />
      <rect x="33" y="53" width="14" height="4" rx="2" fill="#d97706" />
      {/* Lightning bolt */}
      <path d="M44 16 L36 30 L41 30 L36 44 L48 28 L43 28 Z" fill="#fff7ed" />
      {/* Rays */}
      <line x1="40" y1="8" x2="40" y2="12" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="20" x2="57" y2="23" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="20" x2="23" y2="23" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <line x1="63" y1="38" x2="59" y2="38" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <line x1="17" y1="38" x2="21" y2="38" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IlluCarpinteria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#fed7aa" />
      {/* Plank */}
      <rect x="12" y="44" width="56" height="12" rx="4" fill="#c2410c" />
      <rect x="12" y="44" width="56" height="4" rx="2" fill="#ea580c" />
      {/* Hammer handle */}
      <rect x="36" y="22" width="8" height="30" rx="4" fill="#7c2d12" />
      {/* Hammer head */}
      <rect x="26" y="18" width="28" height="14" rx="5" fill="#9a3412" />
      {/* Nail */}
      <rect x="50" y="48" width="4" height="16" rx="2" fill="#78716c" />
      <polygon points="48,48 56,48 52,44" fill="#57534e" />
      {/* Wood grain */}
      <line x1="16" y1="50" x2="24" y2="50" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="50" x2="38" y2="50" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IlluCerrajeria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#fef9c3" />
      {/* Padlock body */}
      <rect x="24" y="36" width="32" height="26" rx="6" fill="#ca8a04" />
      <rect x="24" y="36" width="32" height="10" rx="3" fill="#eab308" />
      {/* Lock shackle */}
      <path d="M31 36 Q31 18 40 18 Q49 18 49 36" stroke="#a16207" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Keyhole */}
      <circle cx="40" cy="51" r="5" fill="#713f12" />
      <rect x="38" y="53" width="4" height="7" rx="2" fill="#713f12" />
      {/* Key */}
      <circle cx="62" cy="24" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
      <circle cx="62" cy="24" r="3" fill="#ca8a04" />
      <rect x="62" y="30" width="4" height="14" rx="2" fill="#facc15" />
      <rect x="62" y="38" width="8" height="3" rx="1.5" fill="#facc15" />
      <rect x="62" y="43" width="6" height="3" rx="1.5" fill="#facc15" />
    </svg>
  );
}

function IlluGasfiteria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#fee2e2" />
      {/* Burner rings */}
      <ellipse cx="40" cy="42" rx="18" ry="8" fill="#dc2626" />
      <ellipse cx="40" cy="42" rx="12" ry="5" fill="#ef4444" />
      {/* Flames */}
      <path d="M30 42 Q28 30 34 26 Q32 34 36 32 Q34 22 40 18 Q38 28 42 26 Q40 20 46 22 Q42 30 46 32 Q50 34 48 26 Q54 30 52 42" fill="#f97316" />
      <path d="M34 42 Q33 34 36 30 Q35 36 38 34 Q37 28 40 25 Q39 31 42 30 Q40 26 44 28 Q42 34 45 32 Q47 36 46 42" fill="#fbbf24" />
      {/* Pot */}
      <rect x="26" y="54" width="28" height="12" rx="4" fill="#475569" />
      <rect x="22" y="52" width="36" height="4" rx="2" fill="#334155" />
      <rect x="17" y="52" width="6" height="6" rx="2" fill="#64748b" />
      <rect x="57" y="52" width="6" height="6" rx="2" fill="#64748b" />
    </svg>
  );
}

function IlluJardineria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#dcfce7" />
      {/* Tree trunk */}
      <rect x="35" y="50" width="10" height="18" rx="4" fill="#92400e" />
      {/* Foliage circles */}
      <circle cx="40" cy="30" r="16" fill="#16a34a" />
      <circle cx="28" cy="40" r="12" fill="#15803d" />
      <circle cx="52" cy="40" r="12" fill="#15803d" />
      <circle cx="40" cy="44" r="12" fill="#16a34a" />
      {/* Small flowers */}
      <circle cx="36" cy="24" r="3" fill="#bbf7d0" />
      <circle cx="44" cy="26" r="2.5" fill="#bbf7d0" />
      <circle cx="32" cy="36" r="2.5" fill="#bbf7d0" />
      {/* Shovel */}
      <rect x="56" y="44" width="6" height="18" rx="3" fill="#a16207" />
      <ellipse cx="59" cy="44" rx="7" ry="9" fill="#854d0e" />
      {/* Soil */}
      <ellipse cx="40" cy="68" rx="20" ry="5" fill="#92400e" opacity="0.4" />
    </svg>
  );
}

function IlluLimpieza({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#e0f2fe" />
      {/* Bucket */}
      <path d="M26 44 L28 66 Q40 70 52 66 L54 44 Z" fill="#0284c7" />
      <path d="M24 40 Q40 36 56 40 L54 44 Q40 48 26 44 Z" fill="#0ea5e9" />
      <path d="M30 40 Q30 30 40 30 Q50 30 50 40" stroke="#7dd3fc" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Bubbles */}
      <circle cx="38" cy="52" r="4" fill="#bae6fd" opacity="0.8" />
      <circle cx="46" cy="56" r="3" fill="#bae6fd" opacity="0.7" />
      <circle cx="34" cy="60" r="2.5" fill="#bae6fd" opacity="0.6" />
      {/* Mop/brush */}
      <rect x="55" y="20" width="5" height="32" rx="2.5" fill="#64748b" />
      <path d="M50 52 L60 52 L62 64 L48 64 Z" fill="#94a3b8" />
      <line x1="51" y1="52" x2="49" y2="64" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="55" y1="52" x2="55" y2="64" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="59" y1="52" x2="61" y2="64" stroke="#cbd5e1" strokeWidth="2" />
      {/* Sparkles */}
      <path d="M16 28 L18 24 L20 28 L16 28" fill="#38bdf8" />
      <path d="M18 24 L22 22 L18 28" fill="#7dd3fc" />
    </svg>
  );
}

function IlluPintura({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#fae8ff" />
      {/* Paint roller */}
      <rect x="14" y="24" width="36" height="14" rx="7" fill="#9333ea" />
      <rect x="14" y="24" width="36" height="7" rx="4" fill="#a855f7" />
      <rect x="48" y="28" width="18" height="4" rx="2" fill="#7c3aed" />
      <rect x="62" y="20" width="4" height="28" rx="2" fill="#6d28d9" />
      {/* Paint drips */}
      <ellipse cx="20" cy="42" rx="4" ry="6" fill="#c084fc" />
      <ellipse cx="30" cy="44" rx="3.5" ry="5" fill="#a855f7" />
      <ellipse cx="40" cy="43" rx="3" ry="4" fill="#d8b4fe" />
      {/* Paint tray */}
      <path d="M10 54 L70 54 L65 68 L15 68 Z" fill="#7c3aed" />
      <path d="M10 54 L70 54 L68 58 L12 58 Z" fill="#9333ea" />
      <ellipse cx="40" cy="61" rx="22" ry="4" fill="#a855f7" opacity="0.6" />
    </svg>
  );
}

function IlluRefrigeracion({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#e0f2fe" />
      {/* AC unit body */}
      <rect x="12" y="28" width="56" height="28" rx="8" fill="#0369a1" />
      <rect x="12" y="28" width="56" height="10" rx="6" fill="#0284c7" />
      {/* Vents */}
      <rect x="20" y="44" width="40" height="3" rx="1.5" fill="#0ea5e9" />
      <rect x="20" y="50" width="40" height="3" rx="1.5" fill="#0ea5e9" />
      {/* Snow/cold indicator */}
      <circle cx="60" cy="32" r="5" fill="#38bdf8" />
      <text x="57" y="36" fontSize="8" fill="white" fontWeight="bold">❄</text>
      {/* Air waves */}
      <path d="M18 62 Q22 58 26 62 Q30 66 34 62" stroke="#7dd3fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M36 62 Q40 58 44 62 Q48 66 52 62" stroke="#7dd3fc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Snowflakes */}
      <path d="M30 74 L30 70 M28 72 L32 72 M28.5 70.5 L31.5 73.5 M31.5 70.5 L28.5 73.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 74 L50 70 M48 72 L52 72" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IlluAlbanileria({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" fill="#f1f5f9" />
      {/* Wall bricks */}
      <rect x="12" y="52" width="56" height="10" rx="2" fill="#dc2626" />
      <rect x="12" y="42" width="24" height="10" rx="2" fill="#ef4444" />
      <rect x="38" y="42" width="30" height="10" rx="2" fill="#ef4444" />
      <rect x="12" y="32" width="30" height="10" rx="2" fill="#dc2626" />
      <rect x="44" y="32" width="24" height="10" rx="2" fill="#dc2626" />
      {/* Mortar lines */}
      <rect x="12" y="41" width="56" height="2" fill="#f8fafc" />
      <rect x="12" y="51" width="56" height="2" fill="#f8fafc" />
      <rect x="36" y="32" width="2" height="10" fill="#f8fafc" />
      <rect x="38" y="42" width="2" height="10" fill="#f8fafc" />
      {/* Trowel */}
      <path d="M18 20 L30 32 L35 28 L23 16 Z" fill="#94a3b8" />
      <path d="M35 28 L40 22 L36 18 L30 32 Z" fill="#64748b" />
      <rect x="38" y="16" width="8" height="18" rx="4" transform="rotate(45 38 16)" fill="#475569" />
    </svg>
  );
}

const SERVICE_ILLUSTRATIONS: Record<string, { Component: React.FC<{ size?: number }>; gradient: string; accent: string }> = {
  "Plomería":      { Component: IlluPlomeria,     gradient: "from-blue-500 to-blue-700",     accent: "#3b82f6" },
  "Electricidad":  { Component: IlluElectricidad,  gradient: "from-amber-400 to-yellow-600",  accent: "#f59e0b" },
  "Carpintería":   { Component: IlluCarpinteria,   gradient: "from-orange-500 to-orange-700", accent: "#ea580c" },
  "Pintura":       { Component: IlluPintura,       gradient: "from-purple-500 to-purple-700", accent: "#9333ea" },
  "Cerrajería":    { Component: IlluCerrajeria,    gradient: "from-yellow-500 to-amber-600",  accent: "#eab308" },
  "Gasfitería":    { Component: IlluGasfiteria,    gradient: "from-red-500 to-red-700",       accent: "#ef4444" },
  "Jardinería":    { Component: IlluJardineria,    gradient: "from-emerald-500 to-green-700", accent: "#10b981" },
  "Limpieza":      { Component: IlluLimpieza,      gradient: "from-cyan-500 to-sky-600",      accent: "#06b6d4" },
  "Refrigeración": { Component: IlluRefrigeracion, gradient: "from-sky-400 to-blue-600",      accent: "#0ea5e9" },
  "Albanilería":   { Component: IlluAlbanileria,   gradient: "from-slate-500 to-slate-700",   accent: "#64748b" },
  "Albañilería":   { Component: IlluAlbanileria,   gradient: "from-slate-500 to-slate-700",   accent: "#64748b" },
};

function getServiceConfig(nombre: string) {
  if (SERVICE_ILLUSTRATIONS[nombre]) return SERVICE_ILLUSTRATIONS[nombre];
  // Fallback
  return { Component: IlluLimpieza, gradient: "from-blue-500 to-blue-700", accent: "#3b82f6" };
}

const STEPS = [
  { label: "Servicio", icon: Sparkles },
  { label: "Detalles", icon: MapPin },
  { label: "Confirmar", icon: CheckCircle },
];

export function NuevaSolicitudPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceId: "",
    descripcion: "",
    direccion: "",
    fechaServicio: "",
    presupuesto: "",
  });

  useEffect(() => {
    authJson<Service[]>("/api/services")
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const selectedService = services.find((s) => String(s.id) === form.serviceId);
  const selectedConfig = selectedService ? getServiceConfig(selectedService.nombre) : null;

  const handleNext = () => {
    if (step === 0 && !form.serviceId) {
      toast({ title: "Elige un tipo de servicio para continuar", variant: "destructive" });
      return;
    }
    if (step === 1) {
      if (!form.descripcion.trim()) { toast({ title: "Describe el problema a resolver", variant: "destructive" }); return; }
      if (!form.direccion.trim()) { toast({ title: "Ingresa tu dirección de servicio", variant: "destructive" }); return; }
      if (!form.fechaServicio) { toast({ title: "Selecciona la fecha y hora preferida", variant: "destructive" }); return; }
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const created = await authJson<{ id: number }>("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          serviceId: parseInt(form.serviceId),
          descripcion: form.descripcion,
          direccion: form.direccion,
          fechaServicio: new Date(form.fechaServicio).toISOString(),
          precioAcordado: form.presupuesto ? parseFloat(form.presupuesto) : undefined,
        }),
      });
      toast({ title: "¡Solicitud publicada!", description: "Los técnicos disponibles ya pueden ver tu solicitud." });
      navigate(`/solicitudes/${created.id}`);
    } catch (err: any) {
      toast({ title: "Error al publicar", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const minDate = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => step > 0 ? setStep((s) => s - 1) : navigate("/solicitudes")}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg leading-none">Nueva Solicitud</h1>
            <p className="text-white/40 text-xs mt-0.5">{STEPS[step].label}</p>
          </div>
          <div className="text-white/40 text-sm font-medium">{step + 1} / {STEPS.length}</div>
        </div>

        {/* Step indicator */}
        <div className="max-w-xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.label} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 ${active ? "opacity-100" : done ? "opacity-100" : "opacity-40"}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      done ? "bg-emerald-500" : active ? "bg-blue-500" : "bg-white/10"
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Icon className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? "text-white" : done ? "text-emerald-400" : "text-white/40"}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${done ? "bg-emerald-500" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 pb-24 relative z-10">

        {/* ─── STEP 0: Choose service ─── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white text-2xl font-extrabold tracking-tight">¿Qué necesitas arreglar?</h2>
              <p className="text-white/50 text-sm mt-1">Tu solicitud llegará a todos los técnicos de esa categoría en Lima.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {services.map((s) => {
                const cfg = getServiceConfig(s.nombre);
                const Illus = cfg.Component;
                const selected = form.serviceId === String(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setForm((f) => ({ ...f, serviceId: String(s.id) }))}
                    className={`relative rounded-2xl overflow-hidden text-left transition-all duration-200 group ${
                      selected
                        ? "ring-2 ring-offset-2 ring-offset-[#0f172a] shadow-xl scale-[1.02]"
                        : "hover:scale-[1.01] hover:shadow-lg"
                    }`}
                    style={{ ringColor: selected ? cfg.accent : undefined } as any}
                  >
                    {/* Card background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-${selected ? "100" : "80"} group-hover:opacity-100 transition-opacity`} />
                    {/* Dark overlay when unselected */}
                    {!selected && <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />}

                    <div className="relative p-4 flex flex-col items-center text-center gap-2">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <Illus size={68} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm leading-tight">{s.nombre}</p>
                        <p className="text-white/70 text-xs mt-0.5">Desde S/ {parseFloat(s.precioBase ?? "0").toFixed(0)}</p>
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" style={{ color: cfg.accent }} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 1: Details ─── */}
        {step === 1 && selectedService && selectedConfig && (
          <div className="space-y-5">
            {/* Service badge */}
            <div className={`flex items-center gap-3 rounded-2xl p-4 bg-gradient-to-r ${selectedConfig.gradient}`}>
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <selectedConfig.Component size={48} />
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Servicio seleccionado</p>
                <p className="text-white font-bold text-xl">{selectedService.nombre}</p>
                <p className="text-white/70 text-xs">{selectedService.descripcion}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white/80 text-sm font-medium">Describe el problema *</Label>
                <Textarea
                  className="mt-1.5 bg-white/8 border-white/15 text-white placeholder:text-white/25 focus:border-blue-400/70 focus:bg-white/10 min-h-[120px] rounded-xl resize-none transition-all"
                  placeholder={`Ej: Se rompió una tubería bajo el lavabo, hay pérdida de agua. Necesito que vengan hoy...`}
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>

              <div>
                <Label className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Dirección del servicio *
                </Label>
                <Input
                  className="mt-1.5 rounded-xl border-white/15 text-white placeholder:text-white/25 focus:border-blue-400/70 transition-all"
                  placeholder="Av. Larco 123, Miraflores, Lima"
                  value={form.direccion}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>

              <div>
                <Label className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Fecha y hora preferida *
                </Label>
                <Input
                  type="datetime-local"
                  min={minDate}
                  className="mt-1.5 rounded-xl border-white/15 text-white [color-scheme:dark] focus:border-blue-400/70 transition-all"
                  value={form.fechaServicio}
                  onChange={(e) => setForm((f) => ({ ...f, fechaServicio: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>

              <div>
                <Label className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Tu presupuesto en S/ (opcional)
                </Label>
                <Input
                  type="number"
                  min={10}
                  step={10}
                  className="mt-1.5 rounded-xl border-white/15 text-white placeholder:text-white/25 focus:border-emerald-400/70 transition-all"
                  placeholder="Ej: 150 — los técnicos pueden hacer contra-oferta"
                  value={form.presupuesto}
                  onChange={(e) => setForm((f) => ({ ...f, presupuesto: e.target.value }))}
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
                <p className="text-white/30 text-xs mt-1.5">Los técnicos verán este presupuesto y podrán proponer otro precio.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Confirm ─── */}
        {step === 2 && selectedService && selectedConfig && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white text-2xl font-extrabold">¿Todo correcto?</h2>
              <p className="text-white/50 text-sm mt-1">Revisa los datos antes de publicar tu solicitud.</p>
            </div>

            {/* Summary card */}
            <div className="rounded-2xl overflow-hidden border border-white/10">
              {/* Header with illustration */}
              <div className={`bg-gradient-to-r ${selectedConfig.gradient} p-5 flex items-center gap-4`}>
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <selectedConfig.Component size={56} />
                </div>
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wide">Tipo de servicio</p>
                  <p className="text-white font-extrabold text-2xl">{selectedService.nombre}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white/5 p-4 space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Dirección</p>
                    <p className="text-white/90 font-medium">{form.direccion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Fecha y hora preferida</p>
                    <p className="text-white/90 font-medium">
                      {new Date(form.fechaServicio).toLocaleDateString("es-PE", {
                        weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {form.presupuesto && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">Presupuesto sugerido</p>
                      <p className="text-white/90 font-bold text-lg">S/ {form.presupuesto}</p>
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-white/40 text-xs mb-1">Descripción del problema</p>
                  <p className="text-white/75 text-sm leading-relaxed">{form.descripcion}</p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-blue-300 font-semibold text-sm">¿Cómo funciona?</p>
              </div>
              <div className="space-y-2">
                {[
                  "Tu solicitud es visible para todos los técnicos de " + selectedService.nombre,
                  "Los técnicos te enviarán ofertas con su precio propuesto",
                  "Tú eliges la mejor oferta y el técnico va a tu domicilio",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-300 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-[#0f172a]/90 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="max-w-xl mx-auto">
          {step < 2 ? (
            <Button
              className="w-full h-13 rounded-2xl font-bold text-base text-white shadow-lg transition-all"
              style={{ background: selectedConfig ? `linear-gradient(135deg, ${selectedConfig.accent}, ${selectedConfig.accent}bb)` : "hsl(226 71% 40%)" }}
              onClick={handleNext}
            >
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="w-full h-13 rounded-2xl font-bold text-base bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publicando...</span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Publicar solicitud</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
