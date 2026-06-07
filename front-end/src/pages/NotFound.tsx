import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          O endereço <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code> não existe.
        </p>
        <Link
          to="/"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
