import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity, Calendar, Shield, Stethoscope, Search, FileText, CheckCircle2,
  ArrowRight, Users, Clock, Lock, Star, Phone, MapPin, Heart,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Clínica SafeCare</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm">Especialidades</Button>
              <Button variant="ghost" size="sm">Médicos</Button>
              <Button variant="ghost" size="sm">Planos</Button>
              <Button variant="ghost" size="sm">Contato</Button>
            </nav>
            <Button size="sm" onClick={() => navigate("/agendamento")}>
              <Calendar className="mr-2 h-4 w-4" />
              Agendar consulta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/80 mb-4">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Agendamento 100% online, sem filas
              </div>
              <h1 className="text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl">
                Cuide da sua saúde com facilidade
              </h1>
              <p className="mt-4 max-w-lg text-base text-primary-foreground/75 lg:mx-0 mx-auto">
                Agende consultas com especialistas, escolha seu plano de saúde ou atendimento
                particular e receba seu comprovante na hora.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/agendamento")}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Agendar consulta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start text-xs text-primary-foreground/70">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Particular ou convênio</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Comprovante instantâneo</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Lista de espera automática</span>
              </div>
            </div>

            {/* Mock UI card */}
            <div className="hidden lg:block">
              <div className="relative mx-auto w-full max-w-sm">
                <div className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/10 p-2 shadow-2xl">
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
                    <div className="h-2 w-2 rounded-full bg-primary-foreground/30" />
                    <div className="ml-2 h-2 w-32 rounded bg-primary-foreground/20" />
                  </div>
                  <div className="rounded-lg bg-card p-4 space-y-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Etapa 1 de 7 — Modalidade</p>
                    <h3 className="text-sm font-bold text-foreground">Como deseja agendar?</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border-2 border-primary bg-primary/5 p-3 text-center">
                        <Stethoscope className="mx-auto mb-1 h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold text-primary">Particular</p>
                      </div>
                      <div className="rounded-md border p-3 text-center">
                        <Shield className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Convênio</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {["Cardiologia", "Dermatologia", "Ortopedia"].map((e, i) => (
                        <div key={i} className={`flex items-center gap-2 rounded-md p-2 text-xs ${i === 0 ? "bg-primary/10 text-primary font-semibold" : "bg-muted/50 text-muted-foreground"}`}>
                          <Stethoscope className="h-3 w-3 shrink-0" /> {e}
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

      {/* Specialties quick access */}
      <section className="py-12 px-4 bg-muted/20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-semibold mb-6 text-muted-foreground">Especialidades disponíveis</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "Cardiologia", "Dermatologia", "Ortopedia", "Pediatria",
              "Neurologia", "Ginecologia", "Oftalmologia", "Psiquiatria",
            ].map((spec) => (
              <button
                key={spec}
                onClick={() => navigate("/agendamento")}
                className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold">Como agendar sua consulta</h2>
          <p className="mt-2 text-sm text-muted-foreground">Simples, rápido e sem complicações</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { step: "1", icon: Stethoscope, title: "Escolha a modalidade", desc: "Particular ou convênio" },
              { step: "2", icon: Search, title: "Selecione o médico", desc: "Filtre por especialidade" },
              { step: "3", icon: Clock, title: "Escolha o horário", desc: "3 opções imediatas" },
              { step: "4", icon: CheckCircle2, title: "Confirme", desc: "Receba o comprovante" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="mb-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm mt-1">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                {i < 3 && <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground hidden sm:block absolute" />}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button size="lg" onClick={() => navigate("/agendamento")}>
              <Calendar className="mr-2 h-5 w-5" />
              Começar agendamento
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">Por que escolher a Clínica SafeCare?</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Agendamento online 24h",
                desc: "Agende sua consulta a qualquer hora, sem precisar ligar para a clínica.",
              },
              {
                icon: Users,
                title: "Lista de espera automática",
                desc: "Se não houver horários disponíveis, entre na lista e seja avisado assim que surgir uma vaga.",
              },
              {
                icon: Shield,
                title: "Particular e convênios",
                desc: "Atendemos principais planos de saúde e consultas particulares com valores acessíveis.",
              },
              {
                icon: FileText,
                title: "Comprovante instantâneo",
                desc: "Receba seu comprovante de agendamento com todos os dados da consulta na hora.",
              },
              {
                icon: Stethoscope,
                title: "Especialistas qualificados",
                desc: "Mais de 50 médicos especialistas com CRM ativo e agenda atualizada em tempo real.",
              },
              {
                icon: Lock,
                title: "Dados protegidos",
                desc: "Seus dados pessoais e de saúde são tratados com sigilo e conformidade com a LGPD.",
              },
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
              { value: "+1.200", label: "Atendimentos/mês", icon: Stethoscope },
              { value: "+50", label: "Médicos ativos", icon: Users },
              { value: "98%", label: "Satisfação", icon: Star },
              { value: "24/7", label: "Agendamento online", icon: Clock },
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
            <h3 className="text-center font-semibold mb-6 text-lg">O que nossos pacientes dizem</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Maria S.", text: "Agendei minha consulta em menos de 2 minutos. Muito prático e rápido!" },
                { name: "João P.", text: "Entrei na lista de espera e fui chamado no mesmo dia. Ótimo sistema!" },
                { name: "Ana L.", text: "Excelente atendimento. O comprovante chegou na hora e salvei no celular." },
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
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold mb-2">Perguntas frequentes</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">Dúvidas sobre o agendamento</p>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              {
                q: "Como agendar uma consulta?",
                a: "Clique em 'Agendar consulta', escolha a modalidade (particular ou convênio), selecione a especialidade, o médico e o horário disponível. O sistema exibirá 3 opções imediatas.",
              },
              {
                q: "O que é a lista de espera?",
                a: "Se nenhum dos horários disponíveis for conveniente, você pode entrar na lista de espera. Assim que uma vaga surgir para a especialidade e médico desejados, você será notificado.",
              },
              {
                q: "Posso agendar para outra pessoa?",
                a: "Sim! O sistema permite buscar o paciente pelo nome, ou cadastrar um novo paciente durante o processo de agendamento.",
              },
              {
                q: "Quais planos de saúde são aceitos?",
                a: "A clínica aceita os principais planos de saúde. Ao selecionar a modalidade 'Convênio', o sistema filtrará automaticamente os médicos que atendem pelo plano escolhido.",
              },
              {
                q: "Como recebo o comprovante?",
                a: "Ao confirmar o agendamento, o sistema gera imediatamente um comprovante com todos os dados da consulta: médico, especialidade, data, horário e situação 'Agendada'.",
              },
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
      <section className="py-16 px-4 bg-primary">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-primary-foreground">Pronto para agendar sua consulta?</h2>
          <p className="mt-2 text-sm text-primary-foreground/75">Processo simples, rápido e sem cadastro obrigatório</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/agendamento")}>
              <Calendar className="mr-2 h-5 w-5" />
              Agendar agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                  <Heart className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">Clínica SafeCare</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Plataforma de agendamento de consultas médicas online. Particular ou convênio,
                com confirmação imediata e comprovante digital.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Serviços</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => navigate("/agendamento")} className="hover:text-foreground">Agendar consulta</button></li>
                <li><button onClick={() => navigate("/lista-espera")} className="hover:text-foreground">Lista de espera</button></li>
                <li><button onClick={() => navigate("/pacientes/novo")} className="hover:text-foreground">Cadastrar paciente</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Contato</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  (62) 3333-0000
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  contato@safecare.med.br
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  Av. T-63, Nº 1234 — Setor Bueno, Goiânia/GO
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Clínica SafeCare. Todos os direitos reservados.</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> LGPD</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> CFM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
