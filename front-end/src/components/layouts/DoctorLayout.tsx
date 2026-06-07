import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { doctorBillingApi } from "@/api/endpoints";
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
import {
  Home,
  Calendar,
  Users,
  LogOut,
  User as UserIcon,
  FilePieChart,
  ClipboardList,
  Moon,
  Sun,
  Wallet,
  MoreHorizontal,
  MapPin,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const doctorNavigationBase = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { name: "Minha Agenda", href: "/doctor/agenda", icon: Calendar },
  { name: "Financeiro", href: "/doctor/financial", icon: Wallet },
  { name: "Pacientes", href: "/doctor/patients", icon: Users },
  { name: "Atestados", href: "/doctor/certificates", icon: FileText },
  { name: "Relatórios", href: "/doctor/reports", icon: FilePieChart },
  { name: "Localidades", href: "/doctor/locations", icon: MapPin },
];

export function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { data: subscription } = useQuery({
    queryKey: ["doctor-subscription"],
    queryFn: async () => (await doctorBillingApi.subscription()).data,
  });

  const doctorNavigation = subscription?.includes_ai_chatbot
    ? [...doctorNavigationBase.slice(0, 6), { name: "IA + Chatbot", href: "/doctor/ai-assistant", icon: Activity }, ...doctorNavigationBase.slice(6)]
    : doctorNavigationBase;

  const mobileMainNav = doctorNavigation.slice(0, 4);
  const mobileMoreNav = [
    ...doctorNavigation.slice(4),
    { name: "Perfil", href: "/doctor/profile", icon: UserIcon },
  ];

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isMoreActive = mobileMoreNav.some((item) => location.pathname === item.href);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="hidden md:block border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 h-14">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Portal Médico</span>
          </div>

          <nav className="flex items-center gap-1">
            {doctorNavigation.map((item) => {
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
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Tasks button */}
            <Button
              variant={location.pathname === "/doctor/tasks" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => navigate("/doctor/tasks")}
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden lg:inline">Tarefas</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user ? getInitials(user.nome) : "M"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user?.nome}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/doctor/profile" className="flex items-center gap-2 cursor-pointer">
                    <UserIcon className="h-4 w-4" />
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
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden border-b bg-card sticky top-0 z-40">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Portal Médico</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={location.pathname === "/doctor/tasks" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/doctor/tasks")}
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user ? getInitials(user.nome) : "M"}
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
                  <Link to="/doctor/profile" className="flex items-center gap-2 cursor-pointer">
                    <UserIcon className="h-4 w-4" />
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
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-6">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav__inner grid-cols-5">
          {mobileMainNav.map((item) => {
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>Mais</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2">
              {mobileMoreNav.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  <Link to={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}
