import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Home, Calendar, Stethoscope, User, LogOut, FileText, Moon, Sun, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/app/dashboard", icon: Home },
  { name: "Consultas", href: "/app/appointments", icon: Calendar },
  { name: "Médicos", href: "/app/doctors", icon: Stethoscope },
  { name: "Atestados", href: "/app/certificates", icon: FileText },
  { name: "Prontuário", href: "/app/medical-record", icon: FileText },
];

export function PatientLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden md:block border-b bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 h-14">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Safe Care</span>
          </div>

          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user ? getInitials(user.nome) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Tema escuro</span>
                </div>
                <Switch checked={isDark} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden border-b bg-card sticky top-0 z-40">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Safe Care</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user ? getInitials(user.nome) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user?.nome}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Tema escuro</span>
                </div>
                <Switch checked={isDark} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-6">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav__inner grid-cols-5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-[56px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
