import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity, Calendar, Shield, Stethoscope, Search, FileText, CheckCircle2,
  ArrowRight, Users, Clock, Lock, Star,
} from "lucide-react";
import { UserRole } from "@/types/api";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectMap: Record<UserRole, string> = {
        [UserRole.MEDICO]: "/doctor/dashboard",
        [UserRole.PACIENTE]: "/app/dashboard",
      };
      navigate(redirectMap[user.role] || "/app/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold">Safe Care</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/para-medicos/planos")}>Planos médicos</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Entrar</Button>
            <Button size="sm" onClick={() => navigate("/register")}>Criar conta</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl">
                Sua saúde no controle, de qualquer lugar
              </h1>
              <p className="mt-4 max-w-lg text-base text-primary-foreground/75 lg:mx-0 mx-auto">
                Agende consultas, acesse prontuários e acompanhe sua saúde em uma plataforma segura.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" variant="secondary" onClick={() => navigate("/register")}>
                  <Calendar className="mr-2 h-5 w-5" /> Agendar consulta
                </Button>
                <Button size="lg" variant="ghost" className="border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto w-full max-w-sm">
                <div className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/10 p-2">
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/20" />
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/20" />
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/20" />
                  </div>
                  <div className="rounded-md bg-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="h-2.5 w-24 rounded bg-foreground/10" />
                        <div className="mt-1.5 h-2 w-16 rounded bg-muted-foreground/10" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[Calendar, FileText, Shield].map((Icon, i) => (
                        <div key={i} className="rounded-md bg-muted/50 p-2.5 text-center">
                          <Icon className="mx-auto h-3.5 w-3.5 text-primary mb-1" />
                          <div className="h-1.5 w-full rounded bg-muted-foreground/10" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 rounded-md bg-muted/30 p-2.5">
                          <div className="h-7 w-7 rounded-md bg-primary/10" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-3/4 rounded bg-foreground/10" />
                            <div className="h-1.5 w-1/2 rounded bg-muted-foreground/10" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold">Como funciona</h2>
          <p className="mt-2 text-sm text-muted-foreground">Três passos para cuidar da sua saúde</p>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", icon: Search, title: "Escolha o médico", desc: "Busque por especialidade ou disponibilidade" },
              { step: "2", icon: Clock, title: "Selecione o horário", desc: "Veja a agenda em tempo real" },
              { step: "3", icon: CheckCircle2, title: "Confirme", desc: "Receba confirmação pelo portal" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">Funcionalidades</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Para pacientes e profissionais</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Calendar, title: "Agendamento online", desc: "Disponibilidade em tempo real, confirmação automática e lembretes." },
              { icon: FileText, title: "Prontuário digital", desc: "Histórico clínico completo, exames e documentos organizados." },
              { icon: Shield, title: "Segurança e LGPD", desc: "Dados criptografados, controle de acesso e conformidade total." },
            ].map((f, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="pt-5 space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "+1.200", label: "Atendimentos", icon: Stethoscope },
              { value: "+50", label: "Médicos ativos", icon: Users },
              { value: "98%", label: "Satisfação", icon: Star },
              { value: "24/7", label: "Acesso ao portal", icon: Clock },
            ].map((m, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                  <m.icon className="h-4 w-4 text-primary mb-1" />
                  <p className="text-xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Testimonials */}
          <div className="mt-12">
            <h3 className="text-center font-semibold mb-6">O que nossos pacientes dizem</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Maria S.", text: "Agendei minha consulta em menos de 2 minutos. Muito prático!" },
                { name: "João P.", text: "Ter meu prontuário online me dá tranquilidade. Recomendo!" },
                { name: "Ana L.", text: "Excelente plataforma. Consigo acompanhar tudo pelo celular." },
              ].map((t, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 text-warning fill-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">"{t.text}"</p>
                    <p className="text-sm font-medium">{t.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Lock, label: "Dados criptografados" },
              { icon: Shield, label: "Controle de acesso" },
              { icon: FileText, label: "Auditoria completa" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <b.icon className="h-4 w-4 text-primary" />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold mb-2">Perguntas frequentes</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">Tire suas dúvidas</p>

          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "Como agendar uma consulta?", a: "Crie sua conta, escolha o médico e selecione um horário disponível." },
              { q: "Posso cancelar ou reagendar?", a: "Sim, diretamente pelo portal na aba 'Minhas consultas'." },
              { q: "A plataforma oferece teleconsulta?", a: "Dependendo do profissional, consultas online estão disponíveis." },
              { q: "Como faço o pagamento?", a: "Por cartão, PIX ou dinheiro presencial. Acompanhe tudo na área de pagamentos." },
              { q: "Meus dados estão seguros?", a: "Sim. Criptografia, controle de acesso e conformidade com a LGPD." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold">Comece agora</h2>
          <p className="mt-2 text-sm text-muted-foreground">Crie sua conta gratuita e agende sua primeira consulta</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate("/register")}>
              <Calendar className="mr-2 h-5 w-5" /> Agendar consulta
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>Entrar</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Safe Care</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Plataforma completa para gestão de saúde, consultas e prontuários.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Links</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li><button onClick={() => navigate("/login")} className="hover:text-foreground">Entrar</button></li>
                <li><button onClick={() => navigate("/register")} className="hover:text-foreground">Criar conta</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Suporte</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>contato@safecare.com</li>
                <li>(62) 3333-0000</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Safe Care. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
