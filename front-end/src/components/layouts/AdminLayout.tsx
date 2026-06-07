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
import { Home, Users, LogOut, Activity, FilePieChart, ClipboardList, Bell, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Tarefas", href: "/admin/tasks", icon: ClipboardList },
  { name: "Notificações", href: "/admin/notifications", icon: Bell },
  { name: "Relatórios", href: "/admin/reports", icon: FilePieChart },
  { name: "Usuários", href: "/admin/users", icon: Users },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop navigation */}
      <header className="hidden md:block border-b bg-card shadow-card sticky top-0 z-40">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-tertiary p-2">
              <Activity className="h-5 w-5 text-tertiary-foreground" />
            </div>
            <span className="text-lg font-bold">Admin Portal</span>
          </div>

          <nav className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-3 lg:gap-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-tertiary text-tertiary-foreground"
                      : "hover:bg-muted"
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
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-tertiary text-tertiary-foreground">
                    {user ? getInitials(user.nome) : "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs font-medium text-tertiary">Administrador</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => event.preventDefault()}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Tema escuro</span>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
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

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-tertiary p-2">
              <Activity className="h-5 w-5 text-tertiary-foreground" />
            </div>
            <span className="text-base font-semibold">Admin</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-tertiary text-xs font-bold text-tertiary-foreground">
                    {user ? getInitials(user.nome) : "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nome}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs font-medium text-tertiary">Administrador</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => event.preventDefault()}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Tema escuro</span>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
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

      <main className="pb-32 pt-4 md:pb-8">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation - Sempre visível em mobile */}
      <nav className="mobile-nav safe-area-inset-bottom">
        <div className="mobile-nav__inner grid-cols-5 safe-area-padding-bottom">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium uppercase tracking-wide transition-all active:scale-95",
                  isActive
                    ? "bg-tertiary/10 text-tertiary font-semibold"
                    : "hover:bg-muted/60"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-tertiary" : "text-muted-foreground"
                  )}
                />
                <span className="whitespace-nowrap leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
