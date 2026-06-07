import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { doctorBillingApi } from "@/api/endpoints";
import type { DoctorPlanOption } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DoctorPlanCard } from "@/components/doctor/DoctorPlanCard";
import { formatDoctorPlanPrice, getHighlightedDoctorPlan } from "@/components/doctor/doctor-plan-utils";
import {
  Activity,
  ArrowRight,
  Bot,
  BriefcaseMedical,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileBarChart2,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

const aiAddonBenefits = [
  "Automatiza respostas operacionais no WhatsApp da clinica.",
  "Reduz carga da recepcao com lembretes, confirmacoes e reagendamentos.",
  "Mantem rastreabilidade das interacoes com historico e permissoes.",
  "Complementa o atendimento sem substituir decisao clinica.",
];

const operationalHighlights = [
  {
    icon: CalendarCheck2,
    title: "Agenda mais organizada",
    description: "Visualize horarios, reduza conflitos e acompanhe sua rotina clinica em um so lugar.",
  },
  {
    icon: CreditCard,
    title: "Financeiro mais previsivel",
    description: "Configure valores, acompanhe pagamentos e tenha mais clareza sobre o faturamento.",
  },
  {
    icon: FileBarChart2,
    title: "Operacao com mais controle",
    description: "Acompanhe relatorios, certificados e tarefas administrativas sem espalhar ferramentas.",
  },
];

const trustPillars = [
  "Onboarding simples para comecar sem friccao",
  "Fluxos pensados para consultorios independentes e clinicas",
  "Base preparada para auditoria, controle e evolucao do produto",
];

const faqs = [
  {
    question: "Posso trocar de plano depois?",
    answer: "Sim. O medico pode alterar o plano posteriormente pela area de perfil, seguindo a disponibilidade configurada na plataforma.",
  },
  {
    question: "A IA ja vem inclusa em todos os planos?",
    answer: "Nao necessariamente. A disponibilidade depende do plano contratado. Quando oferecida como adicional, ela e apresentada de forma separada para manter a escolha clara.",
  },
  {
    question: "A plataforma serve so para agenda?",
    answer: "Nao. A proposta e centralizar agenda, operacao clinica, financeiro, relatorios e recursos de apoio em uma mesma experiencia.",
  },
  {
    question: "O cadastro do medico e imediato?",
    answer: "O fluxo foi desenhado para ser rapido. Depois de criar a conta e selecionar o plano, o profissional ja consegue avancar no uso da plataforma.",
  },
];

export default function DoctorPlans() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = useQuery<DoctorPlanOption[]>({
    queryKey: ["doctor-plans-public"],
    queryFn: async () => (await doctorBillingApi.plans()).data,
  });

  const highlightedPlan = getHighlightedDoctorPlan(plans);
  const starterPlan = plans[0];

  const openDoctorRegister = (planCode?: string) => {
    const params = new URLSearchParams({ role: "doctor" });
    if (planCode) params.set("plan", planCode);
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-85"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Safe Care</p>
              <p className="text-xs text-muted-foreground">Planos para medicos</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => openDoctorRegister()}>
              Criar conta
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.14),_transparent_32%),radial-gradient(circle_at_80%_20%,_hsl(var(--secondary)/0.14),_transparent_24%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--accent)/0.45))]" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-2xl">
                <Badge className="mb-4 gap-2 border-0 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs">Plataforma pensada para rotina medica real</span>
                </Badge>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Escolha um plano que acompanhe o crescimento do seu consultorio.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base lg:text-lg">
                  Reuna agenda, operacao, financeiro, relatorios e recursos inteligentes em uma experiencia clara, profissional e pronta para o dia a dia do medico.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                  <Button
                    size="lg"
                    className="h-11 bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto"
                    onClick={() => openDoctorRegister()}
                  >
                    Comecar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-11 px-6 w-full sm:w-auto" onClick={() => navigate("/login")}>
                    Ja tenho conta
                  </Button>
                </div>

                <div className="mt-6 grid gap-2 grid-cols-1 sm:mt-8 sm:grid-cols-3 sm:gap-3">
                  {[
                    { label: "Agenda e operacao", value: "Centralizadas" },
                    { label: "Fluxo de adesao", value: "Mais simples" },
                    { label: "Evolucao do plano", value: "Sem complicacao" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/50 bg-card/80 p-3 sm:p-4 shadow-card backdrop-blur">
                      <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-xl hidden lg:block">
                <div className="overflow-hidden rounded-[28px] border border-border/50 bg-card shadow-elevated">
                  <div className="border-b border-border/50 bg-gradient-to-r from-primary to-primary/85 px-5 py-4 text-primary-foreground">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Visao do medico</p>
                        <p className="text-xs text-primary-foreground/75">Tudo importante no mesmo fluxo</p>
                      </div>
                      <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15">
                        Experiencia fluida
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {operationalHighlights.map((item) => (
                        <div key={item.title} className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <h2 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h2>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Camada opcional de IA + Chatbot</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Ative automacoes operacionais quando fizer sentido para seu momento.
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                          <Bot className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {aiAddonBenefits.slice(0, 2).map((benefit) => (
                          <div key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                            <span>{benefit}</span>
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

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {trustPillars.map((item, index) => (
              <Card key={item} className="border-border/50 shadow-card">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {index === 0 && <Clock3 className="h-5 w-5" />}
                    {index === 1 && <BriefcaseMedical className="h-5 w-5" />}
                    {index === 2 && <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge className="mb-4 border-0 bg-secondary/10 text-secondary hover:bg-secondary/10">Planos medicos</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Compare opcoes e avance com seguranca.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Cada plano foi apresentado para deixar clara a evolucao de valor, sem poluicao visual e sem esconder os beneficios principais.
              </p>
            </div>

            <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))] sm:mt-10 sm:gap-5">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="overflow-hidden border-border/50 shadow-card">
                      <CardContent className="space-y-4 p-6">
                        <div className="h-5 w-28 rounded bg-muted" />
                        <div className="h-8 w-32 rounded bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-full rounded bg-muted" />
                          <div className="h-4 w-4/5 rounded bg-muted" />
                          <div className="h-4 w-3/4 rounded bg-muted" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : plans.map((plan, index) => (
                    <DoctorPlanCard
                      key={plan.code}
                      plan={plan}
                      index={index}
                      mode="landing"
                      highlighted={highlightedPlan?.code === plan.code}
                      actionLabel={`Assinar ${plan.name}`}
                      onAction={() => openDoctorRegister(plan.code)}
                      footerNote="Cadastro online e troca de plano disponivel conforme sua necessidade."
                    />
                  ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Badge className="mb-4 border-0 bg-primary/10 text-primary hover:bg-primary/10">Beneficios em foco</Badge>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">O que muda na pratica para o medico.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                A proposta nao e so listar funcionalidades, mas mostrar como elas reduzem friccao operacional e criam uma experiencia mais profissional para clinica e paciente.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Stethoscope,
                  title: "Mais foco no atendimento",
                  description: "Menos tempo resolvendo dispersoes administrativas e mais clareza sobre o dia clinico.",
                },
                {
                  icon: Users,
                  title: "Experiencia mais profissional",
                  description: "Fluxos consistentes ajudam o paciente a perceber organizacao, seguranca e agilidade.",
                },
                {
                  icon: ShieldCheck,
                  title: "Mais confianca operacional",
                  description: "Auditoria, historico e estrutura unica para reduzir improviso nos processos.",
                },
                {
                  icon: MessageCircleMore,
                  title: "Comunicacao mais fluida",
                  description: "Com recursos inteligentes, a equipe ganha apoio para confirmacao e duvidas recorrentes.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-border/50 shadow-card">
                  <CardContent className="p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-gradient-to-br from-primary/[0.04] via-background to-secondary/[0.06]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <Badge className="mb-4 gap-2 border-0 bg-secondary/10 text-secondary hover:bg-secondary/10">
                  <Bot className="h-3.5 w-3.5" />
                  Add-on de IA + Chatbot
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Automacao operacional para escalar com mais leveza.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Quando o consultorio precisa responder mais rapido e aliviar a recepcao, a camada de IA ajuda a organizar o operacional sem confundir isso com ato clinico.
                </p>

                <div className="mt-6 grid gap-3">
                  {aiAddonBenefits.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/80 p-4 shadow-card">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="overflow-hidden rounded-[28px] border-secondary/30 shadow-elevated">
                <div className="border-b border-border/50 bg-secondary px-6 py-5 text-secondary-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">IA + Chatbot</p>
                      <p className="text-sm text-secondary-foreground/80">Camada de automacao para clinica e recepcao</p>
                    </div>
                    <Bot className="h-6 w-6" />
                  </div>
                </div>

                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">A partir de</p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight">{formatDoctorPlanPrice(99)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">por medico / mes</p>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Integracao de automacoes, apoio ao WhatsApp e estrutura de evolucao para consultorios que desejam operar com mais eficiencia.
                    </p>
                  </div>

                  <Button className="h-11 w-full bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => openDoctorRegister(highlightedPlan?.code)}>
                    Contratar com plano medico
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
            <Card className="border-border/50 shadow-card">
              <CardHeader>
                <Badge className="mb-3 w-fit border-0 bg-primary/10 text-primary hover:bg-primary/10">Comparativo rapido</Badge>
                <CardTitle className="text-2xl">Uma leitura objetiva para decidir.</CardTitle>
                <CardDescription className="text-sm leading-6">
                  Se voce quer comecar com clareza ou avancar com automacao, os planos abaixo deixam a diferenca visivel em poucos segundos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Melhor para comecar",
                    value: starterPlan?.name ?? "Plano inicial",
                    description: "Boa base para organizar agenda, operacao e fluxo clinico com simplicidade.",
                  },
                  {
                    label: "Melhor para escalar",
                    value: highlightedPlan?.name ?? "Plano avancado",
                    description: "Mais indicado para quem busca ganho operacional e recursos mais robustos.",
                  },
                  {
                    label: "Recurso premium",
                    value: "IA + Chatbot",
                    description: "Apoio a comunicacao e automacoes administrativas conforme contratacao.",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/50 bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Perguntas frequentes</h2>
              <Accordion type="single" collapsible className="rounded-3xl border border-border/50 bg-card px-5 shadow-card">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-border/50">
                    <AccordionTrigger className="py-5 text-left text-sm font-medium hover:no-underline sm:text-base">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-6 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl sm:rounded-[32px] border border-border/50 bg-gradient-to-r from-primary to-primary/90 px-5 py-8 text-primary-foreground shadow-elevated sm:px-8 sm:py-10 lg:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <Badge className="mb-4 border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15">
                  Proximo passo
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Coloque seu consultorio em um fluxo mais moderno, claro e escalavel.</h2>
                <p className="mt-3 text-sm leading-6 text-primary-foreground/80 sm:text-base">
                  Escolha seu plano, conclua o cadastro e comece com uma experiencia pensada para transmitir confianca desde o primeiro acesso.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button size="lg" className="h-11 bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90" onClick={() => openDoctorRegister()}>
                  Criar conta medica
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 border border-primary-foreground/20 px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  onClick={() => navigate("/login")}
                >
                  Entrar na plataforma
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
