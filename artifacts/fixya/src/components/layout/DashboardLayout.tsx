import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  User, 
  Wrench, 
  FileText, 
  CreditCard,
  Settings,
  Users,
  BarChart3,
  ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const UserRole = { usuario: "usuario", tecnico: "tecnico", administrador: "administrador" } as const;

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-muted/20 hidden md:block p-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-10">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  const getLinks = () => {
    const baseLinks = [
      { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
      { href: "/solicitudes", label: "Mis Solicitudes", icon: FileText },
      { href: "/pagos", label: "Pagos", icon: CreditCard },
      { href: "/perfil", label: "Mi Perfil", icon: User },
    ];

    if (user?.role === UserRole.tecnico) {
      return [
        { href: "/dashboard", label: "Panel de Técnico", icon: LayoutDashboard },
        { href: "/solicitudes", label: "Trabajos", icon: Wrench },
        { href: "/pagos", label: "Ingresos", icon: CreditCard },
        { href: "/perfil", label: "Mi Perfil Profesional", icon: User },
      ];
    }

    if (user?.role === UserRole.administrador) {
      return [
        { href: "/dashboard", label: "Panel Administrativo", icon: LayoutDashboard },
        { href: "/admin/usuarios", label: "Usuarios", icon: Users },
        { href: "/admin/tecnicos", label: "Técnicos", icon: Wrench },
        { href: "/solicitudes", label: "Todas las Solicitudes", icon: ListTodo },
        { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
        { href: "/perfil", label: "Configuración", icon: Settings },
      ];
    }

    return baseLinks;
  };

  const links = getLinks();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/10 hidden md:block">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-6 text-primary tracking-tight">Mi Cuenta</h2>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const isActive = location === link.href || 
                              (link.href !== "/dashboard" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {title && (
            <h1 className="text-3xl font-bold tracking-tight mb-8">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}