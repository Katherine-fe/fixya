import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useListServices, getListServicesQueryKey, useGetTopTechnicians, getGetTopTechniciansQueryKey } from "@workspace/api-client-react";
import {
  ArrowRight, Star, Shield, Clock, Wrench, CheckCircle,
  Zap, MapPin, Phone, ChevronRight, TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getServiceEmoji } from "@/lib/serviceIcon";

const TESTIMONIALS = [
  {
    nombre: "Gabriela M.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela",
    distrito: "Miraflores",
    calificacion: 5,
    texto: "Increíble rapidez. En menos de 30 minutos tenía un técnico en casa arreglando mi tablero eléctrico. ¡Totalmente recomendado!",
    servicio: "Electricidad",
  },
  {
    nombre: "Ricardo P.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo",
    distrito: "San Isidro",
    calificacion: 5,
    texto: "José reparó la fuga de agua en tiempo récord. Muy profesional, limpio y el precio fue exactamente el acordado. Sin sorpresas.",
    servicio: "Gasfitería",
  },
  {
    nombre: "Camila S.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Camila",
    distrito: "La Molina",
    calificacion: 5,
    texto: "Llevaba meses buscando un buen carpintero. Luis fabricó mis closets a medida perfectamente. La app es súper fácil de usar.",
    servicio: "Carpintería",
  },
  {
    nombre: "Fernando L.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fernando",
    distrito: "Surco",
    calificacion: 5,
    texto: "Sistema de pagos muy cómodo. Pagué con Yape en segundos y recibí el comprobante al instante. La plataforma es excelente.",
    servicio: "Pintura",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe tu problema",
    desc: "Cuéntanos qué necesitas reparar o instalar. Elige la categoría, agrega fotos y selecciona la fecha que te convenga.",
    color: "from-blue-500 to-blue-700",
    icon: "📝",
  },
  {
    n: "02",
    title: "Recibe ofertas",
    desc: "Los técnicos disponibles verán tu solicitud y enviarán propuestas de precio. Compara y elige la mejor oferta.",
    color: "from-violet-500 to-violet-700",
    icon: "💬",
  },
  {
    n: "03",
    title: "Paga y listo",
    desc: "Acepta la oferta, paga de forma segura con Yape, Plin o tarjeta y sigue el trabajo en tiempo real.",
    color: "from-emerald-500 to-emerald-700",
    icon: "✅",
  },
];

const STATS = [
  { label: "Usuarios activos", value: 4280, suffix: "+" },
  { label: "Técnicos verificados", value: 380, suffix: "+" },
  { label: "Servicios completados", value: 12500, suffix: "+" },
  { label: "Calificación promedio", value: 4.9, suffix: "★", decimals: 1 },
];

function AnimatedNumber({ target, suffix, decimals = 0 }: { target: number; suffix: string; decimals?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = Date.now();
    const raf = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString("es-PE")}
      {suffix}
    </span>
  );
}

const SERVICE_BG: Record<string, string> = {
  gasfit: "from-blue-500 to-cyan-600",
  plom:   "from-blue-500 to-cyan-600",
  electr: "from-amber-500 to-yellow-600",
  carp:   "from-orange-500 to-amber-600",
  pint:   "from-pink-500 to-rose-600",
  limp:   "from-teal-500 to-emerald-600",
  aire:   "from-sky-500 to-blue-600",
  acond:  "from-sky-500 to-blue-600",
  cerr:   "from-slate-500 to-zinc-600",
  jard:   "from-green-500 to-emerald-600",
  alba:   "from-stone-500 to-slate-600",
};

function getServiceGradient(nombre: string): string {
  const key = Object.keys(SERVICE_BG).find((k) => nombre.toLowerCase().includes(k));
  return key ? SERVICE_BG[key] : "from-blue-600 to-indigo-700";
}

export function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: services, isLoading: loadingServices } = useListServices({
    query: { queryKey: getListServicesQueryKey() }
  });

  const { data: topTechs, isLoading: loadingTechs } = useGetTopTechnicians(
    { limit: 4 },
    { query: { queryKey: getGetTopTechniciansQueryKey({ limit: 4 }) } }
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[680px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={`${basePath}/hero-bg.png`} alt="" className="w-full h-full object-cover" />
        </div>
        {/* decorative circles */}
        <div className="absolute top-20 right-10 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 py-20">
          <div className="max-w-3xl">
            {/* badge */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              +380 técnicos disponibles en Lima hoy
            </motion.div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] text-white mb-6">
              Técnicos de confianza,
              <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                en minutos.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-xl text-blue-100/80 max-w-2xl leading-relaxed mb-8">
              Gasfiteros, electricistas, carpinteros y más — verificados, con precios claros
              y seguimiento en tiempo real. Como Uber, pero para tu hogar.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="h-14 px-8 text-base font-bold bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-900/40">
                <Link href="/servicios" className="flex items-center gap-2">
                  Solicitar técnico ahora <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild
                className="h-14 px-8 text-base bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                <Link href="/registro-tecnico" className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> Soy técnico
                </Link>
              </Button>
            </motion.div>

            {/* trust chips */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-3 mt-8">
              {[
                { icon: Shield, text: "Técnicos verificados" },
                { icon: CheckCircle, text: "Garantía de calidad" },
                { icon: Clock, text: "Respuesta en <30 min" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-blue-200 text-sm bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Icon className="w-3.5 h-3.5 text-emerald-400" />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ────────────────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-black">
                  <AnimatedNumber target={s.value} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Así de simple</p>
            <h2 className="text-4xl font-black text-slate-900 mb-4">¿Cómo funciona FixYa?</h2>
            <p className="text-slate-500 text-lg">Tres pasos para tener a un profesional resolviendo tu problema en casa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200" />
            {STEPS.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-6 shadow-lg`}>
                  {step.icon}
                </div>
                <span className="text-5xl font-black text-slate-100 absolute top-6 right-7">{step.n}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2">Categorías</p>
              <h2 className="text-4xl font-black text-slate-900">Servicios más solicitados</h2>
            </div>
            <Button variant="ghost" asChild className="mt-4 md:mt-0 text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold">
              <Link href="/servicios" className="flex items-center gap-1">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {services?.slice(0, 10).map((service, i) => (
                <motion.div key={service.id}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                  <Link href={`/tecnicos?serviceId=${service.id}`}>
                    <div className={`group cursor-pointer rounded-2xl bg-gradient-to-br ${getServiceGradient(service.nombre)} p-5 hover:scale-105 hover:shadow-xl transition-all duration-300 text-white min-h-[140px] flex flex-col justify-between`}>
                      <span className="text-3xl mb-2 block">{getServiceEmoji(service.icono)}</span>
                      <div>
                        <p className="font-bold text-sm leading-tight">{service.nombre}</p>
                        <p className="text-white/70 text-xs mt-0.5">Desde S/ {service.precioBase}/h</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TOP TECHNICIANS ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-2">Top rated</p>
              <h2 className="text-4xl font-black text-white">Profesionales destacados</h2>
              <p className="text-slate-400 text-lg mt-2">Con las mejores calificaciones de la comunidad FixYa.</p>
            </div>
            <Button variant="outline" asChild className="mt-4 md:mt-0 border-slate-600 text-white hover:bg-slate-800 hover:text-white">
              <Link href="/tecnicos">Ver todos los técnicos</Link>
            </Button>
          </div>

          {loadingTechs ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl opacity-20" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {topTechs?.map((tech, i) => {
                const name = `${tech.user?.nombre} ${tech.user?.apellido}`;
                return (
                  <motion.div key={tech.id}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4 }}>
                    <Link href={`/tecnicos/${tech.id}`}>
                      <div className="group bg-slate-800 border border-slate-700 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-900/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            <img
                              src={tech.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                              alt={name}
                              className="w-14 h-14 rounded-full border-2 border-slate-600 group-hover:border-blue-500 transition-colors"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-800" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{name}</p>
                            <p className="text-blue-400 text-xs truncate">{tech.service?.nombre}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-bold text-sm">{tech.promedioCalificacion.toFixed(1)}</span>
                            <span className="text-slate-500 text-xs">({tech.totalTrabajos})</span>
                          </div>
                          <span className="text-slate-300 text-sm font-semibold">S/ {tech.precioHora}/h</span>
                        </div>
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 group-hover:bg-blue-500 text-xs h-8">
                          Ver perfil <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Opiniones reales</p>
            <h2 className="text-4xl font-black text-slate-900">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.calificacion)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{t.texto}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.nombre} className="w-10 h-10 rounded-full border border-slate-200" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" /> {t.distrito} · {t.servicio}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY FIXYA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Ventajas</p>
            <h2 className="text-4xl font-black text-slate-900">¿Por qué elegir FixYa?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, color: "bg-blue-100 text-blue-700", title: "Técnicos Verificados", desc: "Cada profesional pasa por verificación de identidad, antecedentes y certificación de experiencia." },
              { icon: Zap,    color: "bg-amber-100 text-amber-700", title: "Sistema inDriver", desc: "Los técnicos compiten por tu trabajo enviando ofertas de precio. Tú eliges la mejor propuesta." },
              { icon: TrendingUp, color: "bg-emerald-100 text-emerald-700", title: "Seguimiento en vivo", desc: "Mira en tiempo real dónde está tu técnico, su ETA y el estado del trabajo en un mapa interactivo." },
              { icon: Phone, color: "bg-violet-100 text-violet-700", title: "Pago seguro", desc: "Paga con Yape, Plin o tarjeta de crédito. Dinero protegido hasta confirmar que el servicio fue completado." },
              { icon: Star, color: "bg-rose-100 text-rose-700", title: "Calidad Garantizada", desc: "Sistema de calificaciones real. Si el trabajo no cumple estándares, FixYa interviene por ti." },
              { icon: Clock, color: "bg-cyan-100 text-cyan-700", title: "Rápido y disponible", desc: "Técnicos disponibles todos los días. Urgencias atendidas en menos de 30 minutos en Lima Metropolitana." },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="text-5xl mb-6">🔧</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              ¿Listo para solucionar<br />ese problema en casa?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Únete a más de 4,000 usuarios que ya confían en FixYa. Rápido, seguro y garantizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 text-base font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-xl" asChild>
                <Link href="/sign-up">Crear cuenta gratis</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base border-white/30 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/tecnicos">Ver técnicos disponibles</Link>
              </Button>
            </div>
            <p className="text-blue-300 text-sm mt-5">Sin tarjeta requerida · Registro en 2 minutos</p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
