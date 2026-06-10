import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { authJson } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserCheck, UserX } from "lucide-react";

type UserItem = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  activo: boolean;
  createdAt: string;
};

const ROLE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "usuario", label: "Clientes" },
  { value: "tecnico", label: "Técnicos" },
  { value: "administrador", label: "Admins" },
];

const ROLE_BADGE: Record<string, string> = {
  usuario: "bg-blue-100 text-blue-800",
  tecnico: "bg-purple-100 text-purple-800",
  administrador: "bg-amber-100 text-amber-800",
};
const ROLE_LABEL: Record<string, string> = {
  usuario: "Cliente",
  tecnico: "Técnico",
  administrador: "Admin",
};

export function AdminUsuariosPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<number | null>(null);
  const LIMIT = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (roleFilter) params.set("role", roleFilter);
      const data = await authJson<{ users: UserItem[]; total: number }>(`/api/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActivo = async (id: number, current: boolean) => {
    setToggling(id);
    try {
      await authJson(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ activo: !current }),
      });
      setUsers(us => us.map(u => u.id === id ? { ...u, activo: !current } : u));
      toast({ title: current ? "Usuario desactivado" : "Usuario activado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const filtered = search
    ? users.filter(u =>
        `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout title="Gestión de Usuarios">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-sm text-slate-500 mt-1">Total usuarios</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.activo).length}</p>
          <p className="text-sm text-slate-500 mt-1">Activos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{users.filter(u => !u.activo).length}</p>
          <p className="text-sm text-slate-500 mt-1">Inactivos</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setRoleFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                roleFilter === f.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron usuarios.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filtered.map((u) => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${u.nombre} ${u.apellido}`)}&background=e2e8f0&color=64748b&size=40`}
                    alt={u.nombre}
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-900">{u.nombre} {u.apellido}</span>
                      <Badge variant="outline" className={`border-0 text-xs ${ROLE_BADGE[u.role] ?? ""}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </Badge>
                      {!u.activo && (
                        <Badge variant="outline" className="border-0 text-xs bg-red-100 text-red-700">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{u.email}</p>
                    <p className="text-xs text-slate-400">
                      Registro: {new Date(u.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:block">{u.activo ? "Activo" : "Inactivo"}</span>
                  <div className="flex items-center gap-2">
                    {u.activo ? <UserCheck className="w-4 h-4 text-emerald-500" /> : <UserX className="w-4 h-4 text-red-400" />}
                    <Switch
                      checked={u.activo}
                      disabled={toggling === u.id}
                      onCheckedChange={() => toggleActivo(u.id, u.activo)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="px-4 py-2 text-sm text-slate-600">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
