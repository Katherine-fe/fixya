import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { authJson } from "@/lib/api";
import { getServiceEmoji } from "@/lib/serviceIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Wrench, CheckCircle, Star, Shield, TrendingUp } from "lucide-react";

type Service = { id: number; nombre: string; descripcion: string | null; icono: string | null };

export function RegistroTecnicoPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    serviceId: "",
    especialidad: "",
    descripcion: "",
    experienciaAnios: "1",
    precioHora: "50",
  });

  useEffect(() => {
    authJson<Service[] | { services: Service[] }>("/api/services?limit=50")
      .then((data) => setServices(Array.isArray(data) ? data : (data as any).services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, []);

  if (user?.role === "tecnico") {
    return (
      <DashboardLayout title="Registro como Técnico">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">¡Ya eres técnico!</h2>
            <p className="text-slate-500 mb-4">Tu perfil de técnico ya está registrado en FixYa.</p>
            <Button onClick={() => navigate("/perfil")}>Ver mi perfil profesional</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout title="Registro como Técnico">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">¡Solicitud enviada!</h2>
            <p className="text-slate-500 mb-4">
              Tu perfil fue registrado y está pendiente de aprobación. El equipo de FixYa revisará tu solicitud en 24-48 horas.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Ir al Dashboard</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId) {
      toast({ title: "Selecciona una categoría de servicio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await authJson("/api/technicians/me", {
        method: "POST",
        body: JSON.stringify({
          serviceId: parseInt(form.serviceId),
          especialidad: form.especialidad,
          descripcion: form.descripcion,
          experienciaAnios: parseInt(form.experienciaAnios),
          precioHora: parseFloat(form.precioHora),
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      toast({ title: "Error al registrar", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Conviértete en Técnico">
      <div className="max-w-2xl space-y-6">
        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <TrendingUp className="w-5 h-5 text-blue-600" />, title: "Genera ingresos", desc: "Cobra S/ 50-200 por trabajo" },
            { icon: <Star className="w-5 h-5 text-amber-500" />, title: "Construye reputación", desc: "Reseñas de clientes reales" },
            { icon: <Shield className="w-5 h-5 text-emerald-600" />, title: "Plataforma segura", desc: "Pagos garantizados" },
          ].map((b) => (
            <Card key={b.title} className="p-4 text-center">
              <div className="flex justify-center mb-2">{b.icon}</div>
              <p className="font-semibold text-sm text-slate-900">{b.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
            </Card>
          ))}
        </div>

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="w-4 h-4 text-blue-600" /> Información Profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="serviceId">Categoría de servicio *</Label>
                {loadingServices ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Select value={form.serviceId} onValueChange={(v) => setForm(f => ({ ...f, serviceId: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona tu especialidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {getServiceEmoji(s.icono)} {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="especialidad">Especialidad específica *</Label>
                <Input
                  id="especialidad"
                  className="mt-1"
                  placeholder="Ej: Instalaciones eléctricas residenciales, tableros eléctricos"
                  value={form.especialidad}
                  onChange={(e) => setForm(f => ({ ...f, especialidad: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción de tus servicios</Label>
                <Textarea
                  id="descripcion"
                  className="mt-1 min-h-[110px]"
                  placeholder="Cuéntale a los clientes sobre tu experiencia, qué tipos de trabajos haces, y qué te diferencia..."
                  value={form.descripcion}
                  onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experiencia">Años de experiencia *</Label>
                  <Input
                    id="experiencia"
                    type="number"
                    min={0}
                    max={50}
                    className="mt-1"
                    value={form.experienciaAnios}
                    onChange={(e) => setForm(f => ({ ...f, experienciaAnios: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="precio">Precio por hora (S/) *</Label>
                  <Input
                    id="precio"
                    type="number"
                    min={10}
                    step={5}
                    className="mt-1"
                    placeholder="50"
                    value={form.precioHora}
                    onChange={(e) => setForm(f => ({ ...f, precioHora: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                Tu solicitud será revisada por nuestro equipo antes de ser publicada en el directorio de técnicos.
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={submitting}>
                {submitting ? "Enviando solicitud..." : "Registrarme como Técnico"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
