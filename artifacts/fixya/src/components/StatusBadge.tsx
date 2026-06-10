import { Clock, CheckCircle2, Zap, XCircle, AlertCircle, Navigation } from "lucide-react";

export type RequestStatus = "pendiente" | "aceptada" | "en_progreso" | "completada" | "cancelada" | "rechazada";

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  dot: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pendiente:   { label: "Pendiente",   icon: Clock,         className: "bg-amber-100 text-amber-800 border border-amber-200",    dot: "bg-amber-400" },
  aceptada:    { label: "Aceptada",    icon: CheckCircle2,  className: "bg-blue-100 text-blue-800 border border-blue-200",       dot: "bg-blue-500" },
  en_progreso: { label: "En Progreso", icon: Zap,           className: "bg-violet-100 text-violet-800 border border-violet-200", dot: "bg-violet-500" },
  completada:  { label: "Completada",  icon: CheckCircle2,  className: "bg-emerald-100 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
  cancelada:   { label: "Cancelada",   icon: XCircle,       className: "bg-red-100 text-red-700 border border-red-200",          dot: "bg-red-400" },
  rechazada:   { label: "Rechazada",   icon: AlertCircle,   className: "bg-slate-100 text-slate-600 border border-slate-200",    dot: "bg-slate-400" },
};

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente;
  const Icon = cfg.icon;

  if (size === "xs") {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "en_progreso" ? "animate-pulse" : ""}`} />
        {cfg.label}
      </span>
    );
  }

  if (size === "md") {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold ${cfg.className}`}>
        <Icon className="w-4 h-4" />
        {cfg.label}
        {status === "en_progreso" && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse ml-0.5" />}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
      {status === "en_progreso" && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />}
    </span>
  );
}

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente;
}
