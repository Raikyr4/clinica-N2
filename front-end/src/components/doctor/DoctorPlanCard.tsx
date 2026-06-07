import type { DoctorPlanOption } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, Check, ChevronRight, LayoutDashboard } from "lucide-react";
import { formatDoctorPlanPrice } from "@/components/doctor/doctor-plan-utils";

function getPlanAccent(plan: DoctorPlanOption, index: number) {
  if (plan.includes_ai_chatbot) {
    return {
      badge: "IA + Chatbot",
      ring: "border-secondary/40 shadow-elevated",
      surface: "from-secondary/10 via-card to-card",
      icon: "bg-secondary text-secondary-foreground",
      bullet: "bg-secondary text-secondary-foreground",
    };
  }

  if (index === 0) {
    return {
      badge: "Entrada inteligente",
      ring: "border-border/60 shadow-card",
      surface: "from-primary/5 via-card to-card",
      icon: "bg-primary/10 text-primary",
      bullet: "bg-primary text-primary-foreground",
    };
  }

  return {
    badge: "Escala operacional",
    ring: "border-primary/30 shadow-card",
    surface: "from-primary/10 via-card to-card",
    icon: "bg-primary/10 text-primary",
    bullet: "bg-primary text-primary-foreground",
  };
}

type DoctorPlanCardMode = "landing" | "selection" | "profile";

interface DoctorPlanCardProps {
  plan: DoctorPlanOption;
  index: number;
  mode?: DoctorPlanCardMode;
  highlighted?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  footerNote?: string;
  className?: string;
}

export function DoctorPlanCard({
  plan,
  index,
  mode = "landing",
  highlighted = false,
  selected = false,
  onSelect,
  actionLabel,
  onAction,
  footerNote,
  className,
}: DoctorPlanCardProps) {
  const accent = getPlanAccent(plan, index);
  const isCompact = mode === "selection" || mode === "profile";
  const shouldShowContext = mode === "landing";
  const visibleFeatures = isCompact ? plan.features.slice(0, 3) : plan.features;
  const hiddenFeatureCount = plan.features.length - visibleFeatures.length;
  const wrapperClassName = cn(
    "group relative overflow-hidden rounded-[22px] border bg-gradient-to-b text-left transition-all duration-200",
    accent.ring,
    accent.surface,
    highlighted && "xl:-translate-y-2",
    selected && "border-primary ring-2 ring-primary/20",
    onSelect && "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    className,
  );

  const content = (
    <>
      {highlighted && <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-secondary" />}
      {selected && <div className="absolute right-4 top-4 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground">Selecionado</div>}

      <CardHeader className={cn("space-y-3", isCompact ? "p-4 pb-3" : "p-6 pb-4")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge className={cn("border-0", highlighted ? "bg-secondary text-secondary-foreground hover:bg-secondary" : "bg-primary/10 text-primary hover:bg-primary/10")}>
              {highlighted ? "Mais completo" : accent.badge}
            </Badge>
            <CardTitle className={cn("mt-3 font-semibold", isCompact ? "text-xl" : "text-2xl")}>{plan.name}</CardTitle>
            <CardDescription className={cn("mt-1.5 leading-6 text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
              {plan.description}
            </CardDescription>
          </div>

          <div className={cn("hidden shrink-0 items-center justify-center rounded-2xl md:flex", isCompact ? "h-10 w-10" : "h-11 w-11", highlighted ? "bg-secondary text-secondary-foreground" : accent.icon)}>
            {plan.includes_ai_chatbot ? <Bot className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
          </div>
        </div>

        <div className={cn("rounded-2xl border border-border/50 bg-background/75", isCompact ? "p-3.5" : "p-4")}>
          <div className="flex items-end gap-2">
            <span className={cn("font-semibold tracking-tight", isCompact ? "text-3xl" : "text-4xl")}>{formatDoctorPlanPrice(plan.price_monthly)}</span>
            <span className="pb-1 text-xs text-muted-foreground sm:text-sm">/mes</span>
          </div>
          <p className={cn("mt-2 text-muted-foreground", isCompact ? "text-xs leading-5" : "text-sm")}>
            {plan.includes_ai_chatbot
              ? "Plano com recursos avancados e acesso a camada de IA incluida."
              : "Estrutura ideal para organizar operacao, atendimento e crescimento."}
          </p>
        </div>
      </CardHeader>

      <CardContent className={cn(isCompact ? "space-y-3 px-4 pb-4" : "space-y-5 px-6 pb-6")}>
        <div className={cn(isCompact ? "space-y-2.5" : "space-y-3")}>
          {visibleFeatures.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", accent.bullet)}>
                <Check className="h-3 w-3" />
              </div>
              <p className={cn("text-foreground", isCompact ? "text-xs leading-5" : "text-sm leading-6")}>{feature}</p>
            </div>
          ))}
          {hiddenFeatureCount > 0 && (
            <p className="pl-8 text-xs text-muted-foreground">
              +{hiddenFeatureCount} recurso(s) no plano completo
            </p>
          )}
        </div>

        {shouldShowContext && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
            {plan.includes_ai_chatbot
              ? "Indicado para medicos que querem operar com mais automacao e resposta mais agil ao paciente."
              : "Indicado para quem quer estruturar a rotina com clareza, previsibilidade e base solida."}
          </div>
        )}
      </CardContent>

      {(actionLabel || footerNote) && (
        <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-0">
          {actionLabel && onAction && (
            <Button
              className={cn(
                "h-11 w-full",
                highlighted
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={onAction}
            >
              {actionLabel}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {footerNote && <p className="text-center text-xs text-muted-foreground">{footerNote}</p>}
        </CardFooter>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={wrapperClassName} onClick={onSelect}>
        {content}
      </button>
    );
  }

  return <Card className={wrapperClassName}>{content}</Card>;
}
