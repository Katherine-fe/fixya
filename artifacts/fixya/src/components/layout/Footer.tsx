import { Link } from "wouter";

export function Footer() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <img src={`${basePath}/logo.svg`} alt="FixYa" className="h-6 w-6 grayscale opacity-70" />
              <span className="font-bold text-lg text-muted-foreground">FixYa</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              La plataforma de servicios técnicos para el hogar más confiable y rápida de tu ciudad.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Para Clientes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/servicios" className="hover:text-primary">Buscar Servicios</Link></li>
              <li><Link href="/tecnicos" className="hover:text-primary">Ver Técnicos</Link></li>
              <li><Link href="/sign-up" className="hover:text-primary">Crear Cuenta</Link></li>
              <li><a href="#" className="hover:text-primary">Cómo funciona</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Para Técnicos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/registro-tecnico" className="hover:text-primary">Únete a FixYa</Link></li>
              <li><a href="#" className="hover:text-primary">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-primary">Normas de la Comunidad</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-primary">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-primary">Contacto</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} FixYa. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            {/* Social links placeholders */}
            <a href="#" className="hover:text-primary">Twitter</a>
            <a href="#" className="hover:text-primary">Instagram</a>
            <a href="#" className="hover:text-primary">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}