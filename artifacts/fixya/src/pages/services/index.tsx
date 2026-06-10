import { useListServices, getListServicesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Wrench } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function ServicesPage() {
  const { data: services, isLoading } = useListServices({
    query: { queryKey: getListServicesQueryKey() }
  });
  const [search, setSearch] = useState("");

  const filteredServices = services?.filter(s => 
    s.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (s.descripcion && s.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Servicios Disponibles</h1>
        <p className="text-lg text-slate-600">
          Encuentra al profesional adecuado para cualquier reparación o mantenimiento en tu hogar.
        </p>
      </div>

      <div className="relative max-w-xl mx-auto mb-12">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          className="pl-10 h-14 text-lg rounded-2xl bg-white shadow-sm"
          placeholder="Buscar un servicio (ej. Plomería, Electricidad...)" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredServices?.map(service => (
            <Link key={service.id} href={`/tecnicos?serviceId=${service.id}`}>
              <motion.div 
                whileHover={{ y: -5, scale: 1.01 }}
                className="group cursor-pointer rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white h-full flex flex-col"
              >
                <div className="h-40 overflow-hidden relative bg-slate-100">
                  {service.nombre.toLowerCase().includes('gasf') || service.nombre.toLowerCase().includes('plom') ? (
                    <img src={`${basePath}/plumber.png`} alt={service.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : service.nombre.toLowerCase().includes('elec') ? (
                    <img src={`${basePath}/electrician.png`} alt={service.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : service.nombre.toLowerCase().includes('carp') ? (
                    <img src={`${basePath}/carpenter.png`} alt={service.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Wrench className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.nombre}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{service.descripcion}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-medium text-slate-600">Desde</span>
                    <span className="font-bold text-blue-700">S/ {service.precioBase}/h</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}

          {filteredServices?.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Wrench className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-medium text-slate-900 mb-2">No se encontraron servicios</h3>
              <p className="text-slate-500">Intenta con otros términos de búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}