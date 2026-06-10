import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authJson } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ChevronLeft, CreditCard, Smartphone, Copy, X } from "lucide-react";

type MetodoPago = "yape" | "plin" | "tarjeta";
type Step = "metodo" | "detalles" | "procesando" | "exito";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  requestId: number;
  monto: number;
  servicioNombre: string;
  tecnicoNombre: string;
  onSuccess: () => void;
}

const METODOS = [
  {
    id: "yape" as MetodoPago,
    nombre: "Yape",
    color: "bg-purple-600",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    bgLight: "bg-purple-50",
    icon: "/yape-logo.png",
    emoji: "🟣",
    desc: "Paga con tu app Yape",
  },
  {
    id: "plin" as MetodoPago,
    nombre: "Plin",
    color: "bg-green-500",
    textColor: "text-green-700",
    borderColor: "border-green-300",
    bgLight: "bg-green-50",
    icon: "/plin-logo.png",
    emoji: "🟢",
    desc: "Paga con tu app Plin",
  },
  {
    id: "tarjeta" as MetodoPago,
    nombre: "Tarjeta",
    color: "bg-blue-600",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    bgLight: "bg-blue-50",
    icon: null,
    emoji: "💳",
    desc: "Visa, Mastercard, Amex",
  },
];

function QRPattern({ color }: { color: string }) {
  const cells = Array.from({ length: 7 * 7 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    const isCorner =
      (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
    const isFilled = isCorner || Math.random() > 0.5;
    return isFilled;
  });
  return (
    <div className="grid gap-0.5 p-3 bg-white rounded-xl shadow-inner border border-slate-100" style={{ gridTemplateColumns: "repeat(7, 1fr)", width: 84 }}>
      {cells.map((filled, i) => (
        <div key={i} className={`w-full aspect-square rounded-sm ${filled ? color : "bg-transparent"}`} />
      ))}
    </div>
  );
}

function CardVisual({ numero, nombre, expiry, tipo }: { numero: string; nombre: string; expiry: string; tipo: string }) {
  const formatted = numero.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  const displayNombre = nombre || "NOMBRE APELLIDO";
  const displayExpiry = expiry || "MM/AA";
  return (
    <div className={`relative w-full rounded-2xl p-5 text-white overflow-hidden shadow-xl ${
      tipo === "amex" ? "bg-gradient-to-br from-slate-700 to-slate-900" :
      tipo === "visa" ? "bg-gradient-to-br from-blue-700 to-blue-900" :
      "bg-gradient-to-br from-rose-600 to-rose-900"
    }`}>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white -translate-y-12 translate-x-12" />
      <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10 bg-white translate-y-10 -translate-x-10" />
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <div className="text-2xl font-bold tracking-widest opacity-90">FIXYA</div>
          <div className="text-right text-sm font-bold uppercase opacity-80">
            {tipo === "visa" ? "VISA" : tipo === "amex" ? "AMEX" : tipo === "mc" ? "Mastercard" : ""}
          </div>
        </div>
        <div className="font-mono text-lg tracking-widest mb-4 text-center">
          {formatted || "•••• •••• •••• ••••"}
        </div>
        <div className="flex justify-between text-xs opacity-80">
          <div>
            <div className="text-[10px] uppercase opacity-60 mb-0.5">Titular</div>
            <div className="font-medium uppercase truncate max-w-[140px]">{displayNombre}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase opacity-60 mb-0.5">Vence</div>
            <div className="font-medium">{displayExpiry}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function detectTipo(v: string): string {
  const n = v.replace(/\s/g, "");
  if (n.startsWith("4")) return "visa";
  if (n.startsWith("5") || n.startsWith("2")) return "mc";
  if (n.startsWith("3")) return "amex";
  return "";
}

export function PaymentModal({ open, onClose, requestId, monto, servicioNombre, tecnicoNombre, onSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("metodo");
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [telefono, setTelefono] = useState("");
  const [cardNumero, setCardNumero] = useState("");
  const [cardNombre, setCardNombre] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [referencia, setReferencia] = useState("");
  const [progreso, setProgreso] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("metodo");
        setMetodo(null);
        setTelefono("");
        setCardNumero(""); setCardNombre(""); setCardExpiry(""); setCardCvv("");
        setProgreso(0);
        setCopied(false);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "procesando") return;
    setProgreso(0);
    const start = Date.now();
    const duration = 2200;
    const raf = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgreso(p);
      if (p >= 100) {
        clearInterval(raf);
        procesarPago();
      }
    }, 30);
    return () => clearInterval(raf);
  }, [step]);

  const procesarPago = async () => {
    try {
      const data = await authJson<{ referencia: string }>("/api/payments", {
        method: "POST",
        body: JSON.stringify({ requestId, monto, metodoPago: metodo }),
      });
      setReferencia(data.referencia);
      setStep("exito");
    } catch (err: any) {
      toast({ title: "Error al procesar pago", description: err.message, variant: "destructive" });
      setStep("detalles");
    }
  };

  const handleContinuarMetodo = (m: MetodoPago) => {
    setMetodo(m);
    setStep("detalles");
  };

  const handlePagar = () => {
    if (metodo === "tarjeta") {
      if (cardNumero.replace(/\s/g, "").length < 16) {
        toast({ title: "Número de tarjeta inválido", variant: "destructive" }); return;
      }
      if (!cardNombre.trim()) {
        toast({ title: "Ingresa el nombre del titular", variant: "destructive" }); return;
      }
      if (cardExpiry.length < 5) {
        toast({ title: "Fecha de vencimiento inválida", variant: "destructive" }); return;
      }
      if (cardCvv.length < 3) {
        toast({ title: "CVV inválido", variant: "destructive" }); return;
      }
    } else {
      if (telefono.replace(/\D/g, "").length < 9) {
        toast({ title: "Ingresa un número de 9 dígitos", variant: "destructive" }); return;
      }
    }
    setStep("procesando");
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(referencia).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExitoClose = () => {
    onClose();
    onSuccess();
  };

  const metodoInfo = METODOS.find((m) => m.id === metodo);
  const cardTipo = detectTipo(cardNumero);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== "procesando") onClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">

        {/* ───── STEP: METODO ───── */}
        {step === "metodo" && (
          <div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-5 pt-6 pb-8 text-white">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm opacity-80">Total a pagar</p>
                <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-4xl font-black tracking-tight">S/ {monto.toFixed(2)}</p>
              <p className="text-sm opacity-75 mt-1 truncate">{servicioNombre} · {tecnicoNombre}</p>
            </div>

            <div className="px-5 pb-6 -mt-4">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide px-4 pt-4 pb-2">Elige tu método de pago</p>
                {METODOS.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => handleContinuarMetodo(m.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left ${i < METODOS.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center text-xl shrink-0`}>
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{m.nombre}</p>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                <span className="text-emerald-500">🔒</span> Pago 100% seguro y encriptado
              </p>
            </div>
          </div>
        )}

        {/* ───── STEP: DETALLES ───── */}
        {step === "detalles" && metodo && metodoInfo && (
          <div>
            <div className={`px-5 pt-5 pb-5 text-white ${
              metodo === "yape" ? "bg-gradient-to-br from-purple-600 to-purple-800" :
              metodo === "plin" ? "bg-gradient-to-br from-green-500 to-green-700" :
              "bg-gradient-to-br from-blue-600 to-blue-800"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setStep("metodo")} className="opacity-70 hover:opacity-100 transition-opacity">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-semibold">{metodoInfo.nombre}</span>
                <div className="ml-auto opacity-80 text-sm">S/ {monto.toFixed(2)}</div>
              </div>
              <p className="text-2xl font-black">{metodoInfo.emoji} Pagar con {metodoInfo.nombre}</p>
              <p className="text-sm opacity-70 mt-0.5">{servicioNombre} · {tecnicoNombre}</p>
            </div>

            <div className="px-5 py-5 space-y-5">
              {(metodo === "yape" || metodo === "plin") && (
                <>
                  {/* QR simulation */}
                  <div className={`rounded-2xl p-4 ${metodoInfo.bgLight} border ${metodoInfo.borderColor} flex flex-col items-center gap-3`}>
                    <p className="text-sm font-semibold text-slate-700">Escanea el código QR</p>
                    <QRPattern color={metodo === "yape" ? "bg-purple-700" : "bg-green-600"} />
                    <div className="text-center">
                      <p className={`text-xs ${metodoInfo.textColor} font-medium`}>FixYa Servicios SAC</p>
                      <p className="text-xs text-slate-400">RUC 20123456789</p>
                    </div>
                    <div className="w-full border-t border-dashed border-slate-200 pt-3">
                      <p className="text-center text-xs text-slate-500 mb-1">o ingresa el número de teléfono</p>
                      <p className={`text-center font-bold text-lg ${metodoInfo.textColor}`}>999 123 456</p>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Confirma tu número {metodo === "yape" ? "Yape" : "Plin"}</Label>
                    <div className="relative mt-1.5">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="9XX XXX XXX"
                        className="pl-9 h-11 rounded-xl border-slate-200 font-medium"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        maxLength={9}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Ingresa tu número para confirmar el pago de S/ {monto.toFixed(2)}</p>
                  </div>
                </>
              )}

              {metodo === "tarjeta" && (
                <>
                  <CardVisual numero={cardNumero} nombre={cardNombre} expiry={cardExpiry} tipo={cardTipo} />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Número de tarjeta</Label>
                      <div className="relative mt-1">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="1234 5678 9012 3456"
                          className="pl-9 h-11 rounded-xl font-mono tracking-wider"
                          value={cardNumero}
                          onChange={(e) => setCardNumero(formatCard(e.target.value))}
                          maxLength={19}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre del titular</Label>
                      <Input
                        placeholder="NOMBRE APELLIDO"
                        className="mt-1 h-11 rounded-xl uppercase"
                        value={cardNombre}
                        onChange={(e) => setCardNombre(e.target.value.toUpperCase().slice(0, 26))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Vencimiento</Label>
                        <Input
                          placeholder="MM/AA"
                          className="mt-1 h-11 rounded-xl font-mono"
                          value={cardExpiry}
                          maxLength={5}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">CVV</Label>
                        <Input
                          placeholder="•••"
                          type="password"
                          className="mt-1 h-11 rounded-xl font-mono"
                          value={cardCvv}
                          maxLength={4}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handlePagar}
                className={`w-full h-12 rounded-xl font-bold text-base ${
                  metodo === "yape" ? "bg-purple-600 hover:bg-purple-700" :
                  metodo === "plin" ? "bg-green-500 hover:bg-green-600" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {metodoInfo.emoji} Pagar S/ {monto.toFixed(2)}
              </Button>
              <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <span className="text-emerald-500">🔒</span> Simulación segura — sin cobros reales
              </p>
            </div>
          </div>
        )}

        {/* ───── STEP: PROCESANDO ───── */}
        {step === "procesando" && (
          <div className="px-6 py-12 flex flex-col items-center gap-6 min-h-[320px] justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={metodo === "yape" ? "#9333ea" : metodo === "plin" ? "#22c55e" : "#2563eb"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progreso / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.05s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-700">
                {progreso}%
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-slate-900 text-lg">Procesando pago...</p>
              <p className="text-slate-500 text-sm">
                {progreso < 40 ? "Verificando método de pago..." :
                 progreso < 75 ? "Comunicando con el banco..." :
                 "Confirmando transacción..."}
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  metodo === "yape" ? "bg-purple-600" : metodo === "plin" ? "bg-green-500" : "bg-blue-600"
                }`}
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}

        {/* ───── STEP: EXITO ───── */}
        {step === "exito" && (
          <div className="px-6 pb-8 pt-6 flex flex-col items-center gap-5 min-h-[320px]">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in-50 duration-500">
              <CheckCircle className="w-11 h-11 text-emerald-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-black text-slate-900 text-2xl">¡Pago exitoso!</p>
              <p className="text-slate-500 text-sm">Tu pago fue procesado correctamente</p>
            </div>

            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Servicio</span>
                <span className="font-semibold text-slate-700 truncate max-w-[160px] text-right">{servicioNombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Técnico</span>
                <span className="font-semibold text-slate-700 truncate max-w-[160px] text-right">{tecnicoNombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Método</span>
                <span className="font-semibold text-slate-700">{metodoInfo?.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total pagado</span>
                <span className="font-black text-emerald-700 text-base">S/ {monto.toFixed(2)}</span>
              </div>
              <div className="border-t border-emerald-200 pt-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Código de referencia</p>
                  <p className="font-mono font-bold text-slate-800 text-sm">{referencia}</p>
                </div>
                <button
                  onClick={handleCopiar}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <Button
              onClick={handleExitoClose}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-base"
            >
              Ver seguimiento del técnico →
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
