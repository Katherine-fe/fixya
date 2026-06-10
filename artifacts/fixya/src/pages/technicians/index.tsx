import { useLocation } from "wouter";
import { useListTechnicians, getListTechniciansQueryKey, useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function TechniciansPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialServiceId = searchParams.get("serviceId");

  const [serviceFilter, setServiceFilter] = useState<string>(initialServiceId || "all");
  const [search, setSearch] = useState("");

  const { data: services } = useListServices({
    query: { queryKey: getListServicesQueryKey() }
  });

  const { data: response, isLoading } = useListTechnicians(
    { status: "aprobado" },
    { query: { queryKey: getListTechniciansQueryKey({ status: "aprobado" }) } }
  );

  const technicians = response?.technicians || [];

  const filteredTechs = technicians.filter(tech => {
    const matchesService = serviceFilter === "all" || tech.serviceId.toString() === serviceFilter;
    const nameStr = `${tech.user?.nombre} ${tech.user?.apellido}`.toLowerCase();
    const matchesSearch = nameStr.includes(search.toLowerCase()) || 
                          tech.especialidad.toLowerCase().includes(search.toLowerCase());
    return matchesService && matchesSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-blue-900 py-16 text-white mb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">Encuentra a tu profesional</h1>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                className="pl-10 h-14 bg-white text-slate-900 border-none rounded-xl text-lg"
                placeholder="Buscar por nombre o especialidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-14 bg-white text-slate-900 border-none rounded-xl text-lg">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los servicios</SelectItem>
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
          </div>
        ) : filteredTechs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No encontramos técnicos</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Intenta cambiar los filtros de búsqueda para ver más resultados.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setSearch(""); setServiceFilter("all"); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTechs.map(tech => (
              <div key={tech.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start hover:border-blue-300 transition-colors">
                <img 
                  src={tech.user?.avatarUrl || `https://ui-avatars.com/api/?name=${tech.user?.nombre}+${tech.user?.apellido}&background=2563eb&color=fff&size=128`} 
                  alt={tech.user?.nombre}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-50"
                />
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {tech.user?.nombre} {tech.user?.apellido}
                      </h2>
                      <p className="text-blue-700 font-medium">{tech.service?.nombre} • {tech.especialidad}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full text-amber-700 font-bold border border-amber-200 w-fit">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{tech.promedioCalificacion.toFixed(1)}</span>
                      <span className="text-amber-600/80 font-normal ml-1">({tech.totalTrabajos})</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mb-4 line-clamp-2 max-w-3xl">
                    {tech.descripcion || "Técnico profesional de FixYa con amplia experiencia."}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {tech.user?.direccion || 'A domicilio'}</span>
                    <span>•</span>
                    <span>{tech.experienciaAnios} años exp.</span>
                    <span>•</span>
                    <Badge variant={tech.disponible ? "default" : "secondary"} className={tech.disponible ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}>
                      {tech.disponible ? 'Disponible ahora' : 'No disponible'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 min-w-[160px] w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="text-center md:text-right mb-2">
                    <div className="text-sm text-slate-500">Tarifa base</div>
                    <div className="text-3xl font-bold text-slate-900">S/ {tech.precioHora}</div>
                    <div className="text-sm text-slate-500">por hora</div>
                  </div>
                  <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white" asChild>
                    <Link href={`/tecnicos/${tech.id}`}>Ver Perfil</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}