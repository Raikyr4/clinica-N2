import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/endpoints";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Activity, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { handleAPIError, ERROR_MESSAGES } from "@/lib/error";

const loginSchema = z.object({
  email: z.string().email("Email inválido").trim().toLowerCase(),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginVars = { email: string; password: string };

export default function Login() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationKey: ["login"],
    retry: false,
    mutationFn: async (vars: LoginVars) => {
      setErrors({});
      const parsed = loginSchema.safeParse({
        email: vars.email.trim(),
        password: vars.password,
      });

      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.errors.forEach((err) => {
          const key = err.path?.[0] as string | undefined;
          if (key) fieldErrors[key] = err.message;
        });
        setErrors(fieldErrors);
        const e: any = new Error(parsed.error.errors[0]?.message ?? "Dados inválidos");
        e.isValidation = true;
        throw e;
      }

      const { data: authData } = await authApi.login({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      setTokens(authData.access_token, authData.refresh_token);
      const { data: userData } = await authApi.me();
      setUser(userData);
      return userData;
    },
    onMutate: () => { setErrors({}); },
    onSuccess: (userData) => {
      toast.success(`Bem-vindo, ${userData.nome}!`);
      const redirectMap: Record<string, string> = {
        MEDICO: "/doctor/dashboard",
        PACIENTE: "/app/dashboard",
      };
      navigate(redirectMap[userData.role] || "/app/dashboard");
    },
    onError: (error: unknown) => {
      console.error("Erro no login:", error);
      const errorInfo = handleAPIError(error);
      if (errorInfo.isAuth) {
        toast.error(ERROR_MESSAGES.UNAUTHORIZED);
        setErrors({ email: "", password: "Credenciais inválidas" });
        return;
      }
      if (errorInfo.isValidation && Object.keys(errorInfo.fieldErrors).length > 0) {
        setErrors(errorInfo.fieldErrors);
        toast.error(ERROR_MESSAGES.VALIDATION);
        return;
      }
      toast.error(errorInfo.message ?? "Falha ao entrar. Tente novamente.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMutation.isPending) return;
    setErrors({});
    loginMutation.reset();
    try { await loginMutation.mutateAsync({ email, password }); } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-4">
          <Button type="button" variant="ghost" size="sm" className="px-2 text-muted-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Voltar
          </Button>
        </div>

        <Card className="shadow-elevated border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Safe Care</span>
            </div>
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            {(errors.email || errors.password) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Verifique suas credenciais e tente novamente</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => ({ ...prev, email: "" })); }}
                  className={errors.email ? "border-destructive" : ""}
                  autoComplete="email"
                  required
                />
                {errors.email && errors.email.trim() && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((prev) => ({ ...prev, password: "" })); }}
                    className={errors.password ? "border-destructive pr-10 hide-password-toggle" : "pr-10 hide-password-toggle"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
                ) : "Entrar"}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm">
              <span className="text-muted-foreground">Não tem conta? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">Cadastre-se</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
