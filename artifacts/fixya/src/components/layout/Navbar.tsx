import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserRole = {
  usuario: "usuario",
  tecnico: "tecnico",
  administrador: "administrador",
} as const;

export function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: profile } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!user,
    },
  });

  const getInitials = (name?: string | null, surname?: string | null) => {
    if (!name) return "U";
    return `${name.charAt(0)}${surname ? surname.charAt(0) : ""}`.toUpperCase();
  };

  function handleSignOut() {
    logout();
    queryClient.clear();
    setLocation("/login");
  }

  const displayUser = profile || user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="FixYa" className="h-8 w-8" />
            <span className="hidden font-bold text-xl sm:inline-block text-primary">FixYa</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/servicios"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Servicios
            </Link>
            <Link
              href="/tecnicos"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Técnicos
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline underline-offset-4"
              >
                Iniciar Sesión
              </Link>
              <Button asChild size="sm">
                <Link href="/registro">Registrarse</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={displayUser?.avatarUrl || ""}
                      alt={displayUser?.nombre || "Usuario"}
                    />
                    <AvatarFallback>
                      {getInitials(displayUser?.nombre, displayUser?.apellido)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {displayUser?.nombre && (
                      <p className="font-medium">
                        {displayUser.nombre} {displayUser.apellido}
                      </p>
                    )}
                    {displayUser?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {displayUser.email}
                      </p>
                    )}
                    {displayUser?.role && (
                      <p className="text-xs font-semibold text-primary capitalize mt-1">
                        {displayUser.role === UserRole.administrador
                          ? "Administrador"
                          : displayUser.role === UserRole.tecnico
                          ? "Técnico"
                          : "Cliente"}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/dashboard")}>
                  Panel Principal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/perfil")}>
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/solicitudes")}>
                  Mis Solicitudes
                </DropdownMenuItem>
                {displayUser?.role === UserRole.usuario && (
                  <DropdownMenuItem onClick={() => setLocation("/registro-tecnico")}>
                    Convertirme en Técnico
                  </DropdownMenuItem>
                )}
                {displayUser?.role === UserRole.administrador && (
                  <DropdownMenuItem onClick={() => setLocation("/admin/reportes")}>
                    Reportes
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
