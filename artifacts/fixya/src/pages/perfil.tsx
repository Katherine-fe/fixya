import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { authJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Wrench, Save, CheckCircle } from "lucide-react";

type TechProfile = {
  id: number;
  especialidad: string;
  descripcion: string | null;
  experienciaAnios: number;
  precioHora: number;
  disponible: boolean;
  status: string;
  service?: { nombre: string } | null;
};

export function PerfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [userForm, setUserForm] = useState({
    nombre: user?.nombre ?? "",
    apellido: user?.apellido ?? "",
    telefono: user?.telefono ?? "",
    direccion: user?.direccion ?? "",
  });
  const [savingUser, setSavingUser] = useState(false);

  const [techProfile, setTechProfile] = useState<TechProfile | null>(null);
  const [loadingTech, setLoadingTech] = useState(false);
  const [techForm, setTechForm] = useState({
    especialidad: "",
    descripcion: "",
    experienciaAnios: 1,
    precioHora: 0,
    disponible: true,
  });
  const [savingTech, setSavingTech] = useState(false);

  useEffect(() => {
    if (user) {
      setUserForm({
        nombre: user.nombre ?? "",
        apellido: user.apellido ?? "",
        telefono: user.telefono ?? "",
        direccion: user.direccion ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "tecnico") {
      setLoadingTech(true);
      authJson<TechProfile>("/api/technicians/me")
        .then((data) => {
          setTechProfile(data);
          setTechForm({
            especialidad: data.especialidad ?? "",
            descripcion: data.descripcion ?? "",
            experienciaAnios: data.experienciaAnios ?? 1,
            precioHora: data.precioHora ?? 0,
            disponible: data.disponible ?? true,
          });
        })
        .catch(() => setTechProfile(null))
        .finally(() => setLoadingTech(false));
    }
  }, [user?.role]);

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      await authJson("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(userForm),
      });
      toast({ title: "Perfil actualizado", description: "Tus datos se guardaron correctamente." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingUser(false);
    }
  };

  const saveTech = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTech(true);
    try {
      await authJson("/api/technicians/me", {
        method: "PATCH",
        body: JSON.stringify(techForm),
      });
      toast({ title: "Perfil profesional actualizado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingTech(false);
    }
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.nombre ?? "U"} ${user?.apellido ?? ""}`)}&background=2563eb&color=fff&size=128`;

  return (
    <DashboardLayout title="Mi Perfil">
      <div className="max-w-2xl space-y-6">
        {/* Avatar + role */}
        <div className="flex items-center gap-5">
          <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full border-4 border-blue-100 shadow" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.nombre} {user?.apellido}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
              {user?.role === "tecnico" ? "Técnico" : user?.role === "administrador" ? "Administrador" : "Cliente"}
            </span>
          </div>
        </div>

        {/* Personal data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-blue-600" /> Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    className="mt-1"
                    value={userForm.nombre}
                    onChange={(e) => setUserForm(f => ({ ...f, nombre: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    className="mt-1"
                    value={userForm.apellido}
                    onChange={(e) => setUserForm(f => ({ ...f, apellido: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" className="mt-1" value={user?.email ?? ""} disabled />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  className="mt-1"
                  placeholder="+51 999 999 999"
                  value={userForm.telefono}
                  onChange={(e) => setUserForm(f => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  className="mt-1"
                  placeholder="Av. Ejemplo 123, Lima"
                  value={userForm.direccion}
                  onChange={(e) => setUserForm(f => ({ ...f, direccion: e.target.value }))}
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={savingUser}>
                {savingUser ? "Guardando..." : <><Save className="w-4 h-4 mr-2" />Guardar Cambios</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Technician profile */}
        {user?.role === "tecnico" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="w-4 h-4 text-blue-600" /> Perfil Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTech ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : !techProfile ? (
                <p className="text-slate-500 text-sm">No se encontró perfil profesional.</p>
              ) : (
                <form onSubmit={saveTech} className="space-y-4">
                  {techProfile.status === "pendiente" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      Tu perfil está pendiente de aprobación por el administrador.
                    </div>
                  )}
                  {techProfile.status === "aprobado" && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Perfil aprobado · {techProfile.service?.nombre}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      className="mt-1"
                      placeholder="Ej: Instalaciones eléctricas residenciales"
                      value={techForm.especialidad}
                      onChange={(e) => setTechForm(f => ({ ...f, especialidad: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción profesional</Label>
                    <Textarea
                      id="descripcion"
                      className="mt-1 min-h-[100px]"
                      placeholder="Cuéntale a los clientes sobre tu experiencia y servicios..."
                      value={techForm.descripcion}
                      onChange={(e) => setTechForm(f => ({ ...f, descripcion: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experiencia">Años de experiencia</Label>
                      <Input
                        id="experiencia"
                        type="number"
                        min={0}
                        max={50}
                        className="mt-1"
                        value={techForm.experienciaAnios}
                        onChange={(e) => setTechForm(f => ({ ...f, experienciaAnios: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="precio">Precio por hora (S/)</Label>
                      <Input
                        id="precio"
                        type="number"
                        min={0}
                        step={0.5}
                        className="mt-1"
                        value={techForm.precioHora}
                        onChange={(e) => setTechForm(f => ({ ...f, precioHora: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Disponible para trabajos</p>
                      <p className="text-xs text-slate-500">Los clientes podrán contactarte</p>
                    </div>
                    <Switch
                      checked={techForm.disponible}
                      onCheckedChange={(v) => setTechForm(f => ({ ...f, disponible: v }))}
                    />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={savingTech}>
                    {savingTech ? "Guardando..." : <><Save className="w-4 h-4 mr-2" />Guardar Perfil Profesional</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
