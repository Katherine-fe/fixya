import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

// Imports to be created later
import { UserDashboard } from "./user-dashboard";
import { TechnicianDashboard } from "./tech-dashboard";
import { AdminDashboard } from "./admin-dashboard";

export function DashboardRouter() {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ 
    query: { queryKey: getGetMeQueryKey() } 
  });

  useEffect(() => {
    if (user && location === "/dashboard") {
      // Redirect to specific role dashboard
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-[250px] mx-auto" />
          <p className="text-muted-foreground animate-pulse">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  // Render correct dashboard based on URL role
  if (location === "/dashboard/usuario") {
    return <UserDashboard />;
  }
  
  if (location === "/dashboard/tecnico") {
    return <TechnicianDashboard />;
  }
  
  if (location === "/dashboard/administrador") {
    return <AdminDashboard />;
  }

  // If wrong role in URL, redirect to correct one
  if (location.startsWith("/dashboard/") && !location.includes(user.role)) {
    return <Redirect to={`/dashboard/${user.role}`} />;
  }

  return null; // Handled by useEffect redirect
}