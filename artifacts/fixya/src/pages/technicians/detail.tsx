import { useParams, Link } from "wouter";
import { useGetTechnician, getGetTechnicianQueryKey, useListReviews, getListReviewsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Briefcase, Clock, ChevronLeft, Phone, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-amber-400 fill-current" : "text-slate-200 fill-current"}`}
        />
      ))}
    </div>
  );
}

function RequestModal({ techId, techName }: { techId: number; techName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    descripcion: "",
    direccion: "",
    fechaServicio: "",
    presupuesto: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("fixya_auth_token");
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const res = await fetch(`${base}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          technicianId: techId,
          descripcion: form.descripcion,
          direccion: form.direccion,
          fechaServicio: new Date(form.fechaServicio).toISOString(),
          precioAcordado: form.presupuesto ? parseFloat(form.presupuesto) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar solicitud");
      }
      toast({ title: "Solicitud enviada", description: `Tu solicitud fue enviada a ${techName}. Te notificaremos cuando responda.` });
      setOpen(false);
      setForm({ descripcion: "", direccion: "", fechaServicio: "", presupuesto: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-blue-700 hover:bg-blue-800 text-white">
          Solicitar Servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar servicio a {techName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="descripcion">Descripción del problema</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe qué necesitas que haga el técnico..."
              value={form.descripcion}
              onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="mt-1 min-h-[100px]"
              required
            />
          </div>
          <div>
            <Label htmlFor="direccion">Dirección del servicio</Label>
            <Input
              id="direccion"
              placeholder="Av. Ejemplo 123, Lima"
              value={form.direccion}
              onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="fecha">Fecha y hora preferida</Label>
            <Input
              id="fecha"
              type="datetime-local"
              value={form.fechaServicio}
              onChange={(e) => setForm(f => ({ ...f, fechaServicio: e.target.value }))}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="presupuesto">Presupuesto estimado (S/, opcional)</Label>
            <Input
              id="presupuesto"
              type="number"
              placeholder="Ej: 150"
              value={form.presupuesto}
              onChange={(e) => setForm(f => ({ ...f, presupuesto: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TechnicianDetail() {
  const params = useParams<{ id: string }>();
  const techId = parseInt(params.id ?? "0");
  const { user: currentUser } = useAuth();

  const { data: tech, isLoading: loadingTech } = useGetTechnician(
    techId,
    { query: { queryKey: getGetTechnicianQueryKey(techId), enabled: !!techId } }
  );

  const { data: reviewsData, isLoading: loadingReviews } = useListReviews(
    { technicianId: techId },
    { query: { queryKey: getListReviewsQueryKey({ technicianId: techId }), enabled: !!techId } }
  );

  if (loadingTech) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-blue-900 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-8 bg-blue-800" />
            <div className="flex gap-6 items-start">
              <Skeleton className="w-32 h-32 rounded-full bg-blue-800" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-10 w-64 bg-blue-800" />
                <Skeleton className="h-5 w-48 bg-blue-800" />
                <Skeleton className="h-5 w-32 bg-blue-800" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Técnico no encontrado</h2>
        <p className="text-slate-500">El técnico que buscas no existe o fue eliminado.</p>
        <Button asChild variant="outline">
          <Link href="/tecnicos">← Volver al directorio</Link>
        </Button>
      </div>
    );
  }

  const reviews = reviewsData?.reviews ?? [];
  const techName = `${tech.user?.nombre ?? ""} ${tech.user?.apellido ?? ""}`.trim();

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-blue-900 text-white pb-16 pt-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link href="/tecnicos" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Volver al directorio
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img
              src={tech.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(techName)}&background=2563eb&color=fff&size=200`}
              alt={techName}
              className="w-36 h-36 rounded-full object-cover border-4 border-blue-600 shadow-xl"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{techName}</h1>
              <p className="text-blue-200 text-lg mb-4">{tech.service?.nombre} · {tech.especialidad}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-blue-100 mb-6">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">{tech.promedioCalificacion.toFixed(1)}</span>
                  <span>({tech.totalTrabajos} trabajos)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  {tech.experienciaAnios} años de experiencia
                </span>
                {tech.user?.direccion && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {tech.user.direccion}
                  </span>
                )}
                <Badge
                  className={tech.disponible
                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/20"
                    : "bg-slate-500/20 text-slate-300 border border-slate-400/30 hover:bg-slate-500/20"
                  }
                >
                  {tech.disponible ? "Disponible ahora" : "No disponible"}
                </Badge>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-2xl p-6 text-slate-900 min-w-[220px] shadow-xl">
              <div className="text-center mb-4">
                <div className="text-sm text-slate-500 mb-1">Tarifa base</div>
                <div className="text-4xl font-bold text-blue-700">S/ {tech.precioHora}</div>
                <div className="text-sm text-slate-400">por hora</div>
              </div>
              {currentUser ? (
                <RequestModal techId={tech.id} techName={techName} />
              ) : (
                <Button asChild size="lg" className="w-full bg-blue-700 hover:bg-blue-800">
                  <Link href="/login">Iniciar Sesión para Contratar</Link>
                </Button>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                Transacción 100% segura
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-5xl py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Sobre el técnico</h2>
                <p className="text-slate-600 leading-relaxed">
                  {tech.descripcion || `${techName} es un técnico profesional de FixYa especializado en ${tech.especialidad}. Con ${tech.experienciaAnios} años de experiencia, ofrece un servicio de alta calidad y confiable.`}
                </p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                Reseñas de clientes
                {reviews.length > 0 && <span className="text-slate-400 font-normal text-base ml-2">({reviews.length})</span>}
              </h2>

              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                </div>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-slate-500">
                    <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p>Aún no hay reseñas para este técnico.</p>
                    <p className="text-sm mt-1">¡Sé el primero en contratar y dejar una reseña!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.nombre ?? "U")}&background=e2e8f0&color=64748b&size=40`}
                              alt={review.user?.nombre}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-slate-900">{review.user?.nombre} {review.user?.apellido}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={review.calificacion} />
                        </div>
                        {review.comentario && (
                          <p className="text-slate-600 text-sm leading-relaxed">{review.comentario}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Información</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{tech.experienciaAnios} años de experiencia</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Star className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                    <span>{tech.totalTrabajos} trabajos completados</span>
                  </div>
                  {tech.user?.telefono && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{tech.user.telefono}</span>
                    </div>
                  )}
                  {tech.user?.direccion && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{tech.user.direccion}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Calificación global</h3>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-bold text-slate-900">{tech.promedioCalificacion.toFixed(1)}</span>
                  <div className="mb-1">
                    <StarRating rating={Math.round(tech.promedioCalificacion)} />
                    <p className="text-xs text-slate-400 mt-1">{tech.totalTrabajos} reseñas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentUser && (
              <RequestModal techId={tech.id} techName={techName} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
