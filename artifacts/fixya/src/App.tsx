import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";

// Pages
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { ServicesPage } from "@/pages/services";
import { TechniciansPage } from "@/pages/technicians";
import { TechnicianDetail } from "@/pages/technicians/detail";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Dashboard
import { DashboardRouter } from "@/pages/dashboard/router";
import { AdminReports } from "@/pages/admin/reports";

// New pages
import { SolicitudesPage } from "@/pages/solicitudes";
import { SolicitudDetailPage } from "@/pages/solicitud-detail";
import { NuevaSolicitudPage } from "@/pages/nueva-solicitud";
import { PagosPage } from "@/pages/pagos";
import { PerfilPage } from "@/pages/perfil";
import { RegistroTecnicoPage } from "@/pages/registro-tecnico";
import { AdminUsuariosPage } from "@/pages/admin/usuarios";
import { AdminTecnicosPage } from "@/pages/admin/tecnicos-admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Home />;
}

function Spinner() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "administrador") return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  const queryClient = useQueryClient();

  return (
    <AuthProvider onUserChange={() => queryClient.clear()}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/login" component={LoginPage} />
            <Route path="/registro" component={RegisterPage} />

            <Route path="/servicios" component={ServicesPage} />
            <Route path="/tecnicos" component={TechniciansPage} />
            <Route path="/tecnicos/:id" component={TechnicianDetail} />

            <Route
              path="/dashboard"
              component={() => (
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/:role"
              component={() => (
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/solicitudes"
              component={() => (
                <ProtectedRoute>
                  <SolicitudesPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/solicitudes/:id"
              component={() => (
                <ProtectedRoute>
                  <SolicitudDetailPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/nueva-solicitud"
              component={() => (
                <ProtectedRoute>
                  <NuevaSolicitudPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/pagos"
              component={() => (
                <ProtectedRoute>
                  <PagosPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/perfil"
              component={() => (
                <ProtectedRoute>
                  <PerfilPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/registro-tecnico"
              component={() => (
                <ProtectedRoute>
                  <RegistroTecnicoPage />
                </ProtectedRoute>
              )}
            />

            <Route
              path="/admin/reportes"
              component={() => (
                <AdminRoute>
                  <AdminReports />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/usuarios"
              component={() => (
                <AdminRoute>
                  <AdminUsuariosPage />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/tecnicos"
              component={() => (
                <AdminRoute>
                  <AdminTecnicosPage />
                </AdminRoute>
              )}
            />

            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
      <Toaster />
    </AuthProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
