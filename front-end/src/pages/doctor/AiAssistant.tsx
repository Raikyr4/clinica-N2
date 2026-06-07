import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { doctorAiAssistantApi, doctorBillingApi } from "@/api/endpoints";
import type { DoctorAiAssistantSettings, DoctorAiInteraction } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Link2,
  MessageCircleMore,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  PowerOff,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Workflow,
} from "lucide-react";

const STATUS_LABEL: Record<number, string> = {
  0: "Inativo",
  1: "Ativo",
  2: "Pausado",
  3: "Cancelado",
};

function getApiErrorInfo(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    return {
      status: error.response?.status,
      detail: typeof detail === "string" ? detail : error.message || "Ainda nao foi possivel carregar a configuracao deste modulo.",
    };
  }

  if (error instanceof Error) {
    return {
      status: undefined,
      detail: error.message || "Ainda nao foi possivel carregar a configuracao deste modulo.",
    };
  }

  return {
    status: undefined,
    detail: "Ainda nao foi possivel carregar a configuracao deste modulo.",
  };
}

function SetupPendingState({
  detail,
  onRetry,
  onOpenProfile,
}: {
  detail: string;
  onRetry: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/50 bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-6 text-primary-foreground shadow-elevated sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_30%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <Badge className="mb-4 border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15">
              IA + Chatbot
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Seu modulo esta contratado, mas a integracao ainda nao foi configurada.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/80 sm:text-base">
              Em vez de travar a experiencia, esta area agora mostra com clareza o estado atual da implantacao.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="h-11 bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
              </Button>
              <Button variant="ghost" className="h-11 border border-primary-foreground/20 px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={onOpenProfile}>
                Ver plano no perfil <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <Card className="border-primary-foreground/15 bg-white/10 text-primary-foreground shadow-none backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5" /> Situacao atual</CardTitle>
              <CardDescription className="text-primary-foreground/75">O produto esta habilitado no plano, mas ainda sem base operacional ativa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/65">Diagnostico</p>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/90">{detail}</p>
              </div>
              <div className="grid gap-2">
                {["Plano com acesso ao modulo confirmado.", "Configuracao operacional ainda pendente.", "Interface protegida contra quebra total da tela."].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-primary-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Link2, title: "Conectar integracoes", description: "A plataforma precisa da ligacao com a automacao e o provedor de IA para comecar a responder." },
          { icon: Workflow, title: "Publicar fluxos administrativos", description: "Confirmacoes, reagendamentos e mensagens operacionais dependem dos fluxos estarem ativos." },
          { icon: ShieldCheck, title: "Validar governanca", description: "Permissoes, horarios e escopo do bot devem estar definidos antes de abrir o atendimento automatizado." },
        ].map((item) => (
          <Card key={item.title} className="border-border/50 shadow-card">
            <CardContent className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><item.icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

/* AI Chat Sub-tab */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function AiChatTab() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);

  const chatQuery = useQuery({
    queryKey: ["doctor-ai-chat-messages"],
    queryFn: async () => (await doctorAiAssistantApi.chatMessages(120)).data,
    retry: false,
    refetchInterval: false,
  });

  const baseMessages = useMemo<ChatMessage[]>(() => {
    const items = (chatQuery.data ?? []).slice().sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (items.length === 0) {
      return [
        {
          id: "welcome",
          role: "assistant",
          content: "Ola! Sou seu assistente IA. Posso ajudar com perguntas sobre agenda, pacientes e financeiro.",
          timestamp: new Date(),
        },
      ];
    }

    return items.map((item) => ({
      id: item.id,
      role: item.direction === 0 ? "user" : "assistant",
      content: item.message_text,
      timestamp: new Date(item.created_at),
    }));
  }, [chatQuery.data]);

  useEffect(() => {
    setLiveMessages(baseMessages);
  }, [baseMessages]);

  const sendChatMutation = useMutation({
    mutationFn: async () => {
      const messageText = input.trim();
      if (!messageText) return;

      const token = useAuthStore.getState().accessToken;
      if (!token) throw new Error("Sessao expirada. Faca login novamente.");

      const userTempId = `temp-user-${Date.now()}`;
      const assistantTempId = `temp-assistant-${Date.now()}`;
      setLiveMessages((prev) => [
        ...prev,
        { id: userTempId, role: "user", content: messageText, timestamp: new Date() },
        { id: assistantTempId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
      const streamBaseUrl = import.meta.env.DEV ? "" : configuredApiUrl || "";
      const response = await fetch(`${streamBaseUrl}/api/v1/doctor/ai-assistant/chat/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 404 || response.status === 405 || !response.body) {
          const fallbackTurn = (await doctorAiAssistantApi.sendChatMessage({ message: messageText })).data;
          setLiveMessages((prev) =>
            prev.map((item) => {
              if (item.id === userTempId) {
                return {
                  id: fallbackTurn.user_message.id,
                  role: "user",
                  content: fallbackTurn.user_message.message_text,
                  timestamp: new Date(fallbackTurn.user_message.created_at),
                };
              }
              if (item.id === assistantTempId) {
                return {
                  id: fallbackTurn.assistant_message.id,
                  role: "assistant",
                  content: fallbackTurn.assistant_message.message_text,
                  timestamp: new Date(fallbackTurn.assistant_message.created_at),
                };
              }
              return item;
            })
          );
          return;
        }

        const raw = await response.text();
        let detail = raw;
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.detail || raw;
        } catch {
          // Keeps raw response text when JSON parsing fails.
        }
        throw new Error(detail || "Falha ao iniciar stream da conversa.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";
      let hasDoneEvent = false;
      let donePayload: { user_message?: DoctorAiInteraction; assistant_message?: DoctorAiInteraction } | null = null;

      const mergeChunk = (chunk: string) => {
        streamedText += chunk;
        setLiveMessages((prev) =>
          prev.map((item) =>
            item.id === assistantTempId
              ? { ...item, content: streamedText, timestamp: new Date() }
              : item
          )
        );
      };

      const processEvent = (eventName: string, payload: Record<string, unknown>) => {
        if (eventName === "delta") {
          const chunk = payload.chunk;
          if (typeof chunk === "string" && chunk.length > 0) {
            mergeChunk(chunk);
          }
        } else if (eventName === "done") {
          donePayload = payload as { user_message?: DoctorAiInteraction; assistant_message?: DoctorAiInteraction };
          hasDoneEvent = true;
        } else if (eventName === "error") {
          if (hasDoneEvent) return;
          const reason = typeof payload.reason === "string" ? payload.reason : "";
          const detail = typeof payload.detail === "string" ? payload.detail : "Falha durante stream da conversa.";
          throw new Error(reason ? `${detail} (${reason})` : detail);
        }
      };

      const consumeRawEvent = (rawEvent: string) => {
        if (!rawEvent) return;

        let eventName = "message";
        let dataText = "";
        rawEvent.split("\n").forEach((line) => {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataText += line.slice(5).trim();
          }
        });

        let payload: Record<string, unknown> = {};
        if (dataText) {
          try {
            payload = JSON.parse(dataText) as Record<string, unknown>;
          } catch {
            return;
          }
        }

        processEvent(eventName, payload);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let separatorIndex = buffer.indexOf("\n\n");
        while (separatorIndex >= 0) {
          const rawEvent = buffer.slice(0, separatorIndex).replace(/\r/g, "").trim();
          buffer = buffer.slice(separatorIndex + 2);
          separatorIndex = buffer.indexOf("\n\n");

          if (!rawEvent) continue;

          consumeRawEvent(rawEvent);
        }
      }

      const trailingEvent = buffer.replace(/\r/g, "").trim();
      if (trailingEvent) {
        consumeRawEvent(trailingEvent);
      }

      if (!hasDoneEvent && streamedText.length === 0) {
        throw new Error("Fluxo de stream interrompido antes da finalizacao.");
      }

      if (donePayload?.assistant_message) {
        const assistantMessage = donePayload.assistant_message;
        const userMessage = donePayload.user_message;
        setLiveMessages((prev) =>
          prev.map((item) => {
            if (userMessage && item.id === userTempId) {
              return {
                id: userMessage.id,
                role: "user",
                content: userMessage.message_text,
                timestamp: new Date(userMessage.created_at),
              };
            }
            if (assistantMessage && item.id === assistantTempId) {
              return {
                id: assistantMessage.id,
                role: "assistant",
                content: assistantMessage.message_text,
                timestamp: new Date(assistantMessage.created_at),
              };
            }
            return item;
          })
        );
      }
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["doctor-ai-chat-messages"] });
    },
    onError: (error) => {
      const info = getApiErrorInfo(error);
      const fallback = error instanceof Error ? error.message : "Nao foi possivel enviar mensagem para a IA.";
      toast.error(info.detail || fallback);
      queryClient.invalidateQueries({ queryKey: ["doctor-ai-chat-messages"] });
    },
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    const bottom = messagesBottomRef.current;
    if (!container || !bottom) return;

    bottom.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [liveMessages, sendChatMutation.isPending]);

  const messages = liveMessages;

  const handleSend = () => {
    if (!input.trim() || sendChatMutation.isPending) return;
    sendChatMutation.mutate();
  };

  return (
    <Card className="border-border/50 shadow-card flex flex-col h-[calc(100vh-16rem)] min-h-[420px]">
      <CardHeader className="pb-3 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">Assistente IA</CardTitle>
            <CardDescription className="text-xs">
              Conversa em linguagem natural com contexto da sua operacao.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatQuery.isLoading && (
          <p className="text-xs text-muted-foreground text-center">Carregando conversa...</p>
        )}
        {sendChatMutation.isPending && (
          <p className="text-[11px] text-muted-foreground text-center">IA pensando...</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted/60 border border-border/40 rounded-bl-md"
              )}
            >
              <p>{msg.content}</p>
              <p className={cn("mt-1 text-[10px]", msg.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {msg.timestamp.toLocaleString()}
              </p>
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                <UserIcon className="h-4 w-4 text-secondary" />
              </div>
            )}
          </div>
        ))}

        {sendChatMutation.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesBottomRef} />
      </div>

      <div className="shrink-0 border-t border-border/40 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Pergunte sobre pacientes, agenda, financeiro..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
            disabled={sendChatMutation.isPending}
          />
          <Button onClick={handleSend} disabled={!input.trim() || sendChatMutation.isPending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          As respostas usam IA e contexto da aplicacao. Sempre valide antes de tomar decisoes criticas.
        </p>
      </div>
    </Card>
  );
}

function AiSettingsTab({ settings }: { settings: DoctorAiAssistantSettings | undefined }) {
  const usage = settings?.usage;
  const dashboard = settings?.openai_dashboard;
  const localTotalMessages = (usage?.inbound_messages ?? 0) + (usage?.outbound_messages ?? 0);
  const dashboardTokens = dashboard?.available ? dashboard.total_tokens : usage?.tokens_used ?? 0;
  const hasOfficialSync = dashboard?.available ?? false;
  const syncNotice = dashboard?.error;
  const periodLabel = usage?.reference_month
    ? new Date(usage.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    : "Mes atual";
  const dashboardCost = dashboard?.total_cost_value != null
    ? `${dashboard.total_cost_currency?.toUpperCase() ?? "USD"} ${dashboard.total_cost_value.toFixed(4)}`
    : "Aguardando sync";

  const metricItems = [
    { label: "Tokens totais", value: dashboardTokens.toLocaleString(), detail: hasOfficialSync ? "OpenAI Usage API" : "Uso local confirmado" },
    { label: "Entrada", value: (dashboard?.input_tokens ?? 0).toLocaleString(), detail: hasOfficialSync ? "input tokens oficiais" : "Disponivel no sync oficial" },
    { label: "Saida", value: (dashboard?.output_tokens ?? 0).toLocaleString(), detail: hasOfficialSync ? "output tokens oficiais" : "Disponivel no sync oficial" },
    { label: "Custo", value: dashboardCost, detail: hasOfficialSync ? "OpenAI Costs API" : "Configure AdminApiKey" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="h-4 w-4 text-primary" /> Configurações da IA
            </CardTitle>
            <CardDescription className="text-xs">
              OpenAI como unico provedor, modelo ativo e consolidado de uso.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Provedor</p>
              <p className="mt-1 text-sm font-semibold">OpenAI</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Modelo</p>
              <p className="mt-1 text-sm font-semibold">{dashboard?.model ?? "gpt-5-mini"}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Periodo</p>
              <p className="mt-1 text-sm font-semibold capitalize">{periodLabel}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mensagens</p>
              <p className="mt-1 text-sm font-semibold">{localTotalMessages.toLocaleString()} / {(usage?.limits_messages ?? 0).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button variant="outline" size="sm" onClick={() => window.open(dashboard?.usage_dashboard_url ?? "https://platform.openai.com/usage", "_blank")}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Usage dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(dashboard?.costs_dashboard_url ?? "https://platform.openai.com/usage/costs", "_blank")}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Costs dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sincronizacao</CardTitle>
            <CardDescription className="text-xs">{dashboard?.source ?? "Metricas locais do SafeCare"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/50 p-3">
              <span className="text-sm">Status</span>
              <Badge variant={hasOfficialSync ? "default" : "secondary"}>
                {hasOfficialSync ? "Sincronizado" : "IA pronta"}
              </Badge>
            </div>
            <div className="rounded-xl border border-border/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {hasOfficialSync ? "Ultima sincronizacao" : "Ultima atualizacao local"}
              </p>
              <p className="mt-1 text-sm">
                {dashboard?.last_synced_at ? new Date(dashboard.last_synced_at).toLocaleString() : "Ainda nao sincronizado"}
              </p>
            </div>
            {syncNotice && (
              <p className="rounded-xl border border-border/50 bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                {syncNotice}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-card p-3 shadow-card">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-lg font-bold">{item.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <Card className="border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Custos por item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(dashboard?.costs ?? []).length > 0 ? (
            dashboard?.costs.map((item) => (
              <div key={`${item.line_item}-${item.project_id}-${item.amount_value}`} className="flex items-center justify-between rounded-xl border border-border/50 p-3 text-sm">
                <span>{item.line_item ?? "Item sem nome"}</span>
                <span className="font-semibold">{item.amount_currency?.toUpperCase() ?? "USD"} {item.amount_value.toFixed(4)}</span>
              </div>
            ))
          ) : (
            <p className="py-3 text-sm text-muted-foreground">Sem custos detalhados retornados pela OpenAI para este periodo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AiWorkspaceTab({ settings }: { settings: DoctorAiAssistantSettings | undefined }) {
  const [activeAiTab, setActiveAiTab] = useState("chat");

  return (
    <Tabs value={activeAiTab} onValueChange={setActiveAiTab}>
      <TabsList className="grid w-full max-w-sm grid-cols-2">
        <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
          <Settings2 className="h-3.5 w-3.5" />
          Configurações da IA
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="mt-4">
        <AiChatTab />
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <AiSettingsTab settings={settings} />
      </TabsContent>
    </Tabs>
  );
}

/* ChatBot Config Sub-tab */
function ChatBotConfigTab({
  settings,
  editable,
  setLocalSettings,
  updateMutation,
  statusMutation,
  simulatePhone,
  setSimulatePhone,
  simulateMessage,
  setSimulateMessage,
  simulateMutation,
  interactionsQuery,
}: {
  settings: DoctorAiAssistantSettings | undefined;
  editable: DoctorAiAssistantSettings | null;
  setLocalSettings: (s: DoctorAiAssistantSettings | null) => void;
  updateMutation: ReturnType<typeof useMutation<unknown, unknown, void>>;
  statusMutation: ReturnType<typeof useMutation<unknown, unknown, "activate" | "pause" | "cancel">>;
  simulatePhone: string;
  setSimulatePhone: (v: string) => void;
  simulateMessage: string;
  setSimulateMessage: (v: string) => void;
  simulateMutation: ReturnType<typeof useMutation<unknown, unknown, void>>;
  interactionsQuery: ReturnType<typeof useQuery>;
}) {
  const whatsappLink = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`
    : "";

  const handleCopyLink = () => {
    if (whatsappLink) {
      navigator.clipboard.writeText(whatsappLink);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="space-y-4">
      {/* WhatsApp Link & Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(142,70%,45%)]/10">
                <MessageCircleMore className="h-5 w-5 text-[hsl(142,70%,45%)]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Link do WhatsApp</p>
                <p className="text-xs text-muted-foreground">Compartilhe com seus pacientes</p>
              </div>
            </div>
            {whatsappLink ? (
              <div className="flex gap-2">
                <Input value={whatsappLink} readOnly className="text-xs flex-1" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => window.open(whatsappLink, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Configure o numero de WhatsApp abaixo para gerar o link.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Status do modulo</p>
                  <p className="text-xs text-muted-foreground">Controle de ativacao</p>
                </div>
              </div>
              <Badge>{STATUS_LABEL[settings?.status ?? 0]}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => statusMutation.mutate("activate")} className="flex-1">
                <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Ativar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate("pause")} className="flex-1">
                <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Pausar
              </Button>
              <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("cancel")} className="flex-1">
                <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config form */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings2 className="h-4 w-4 text-primary" /> Configuracoes do Chatbot
          </CardTitle>
          <CardDescription className="text-xs">WhatsApp, horarios e regras operacionais.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">WhatsApp vinculado</Label>
            <Input
              value={editable?.whatsapp_number ?? ""}
              onChange={(e) => setLocalSettings({ ...(editable as DoctorAiAssistantSettings), whatsapp_number: e.target.value })}
              placeholder="+55 11 99999-9999"
              className="h-9"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs">Timezone</Label>
            <Input
              value={editable?.timezone ?? ""}
              onChange={(e) => setLocalSettings({ ...(editable as DoctorAiAssistantSettings), timezone: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-xs">Mensagem automatica (saudacao)</Label>
            <Textarea
              value={(editable?.auto_messages as Record<string, string> | undefined)?.greeting ?? ""}
              onChange={(e) =>
                setLocalSettings({
                  ...(editable as DoctorAiAssistantSettings),
                  auto_messages: { ...(editable?.auto_messages as Record<string, string>), greeting: e.target.value },
                })
              }
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Encaminhar duvidas clinicas para humano</p>
              <p className="text-xs text-muted-foreground">Mantem o bot apenas no escopo administrativo.</p>
            </div>
            <Switch
              checked={Boolean((editable?.permissions as Record<string, boolean> | undefined)?.require_human_handoff_on_clinical_questions)}
              onCheckedChange={(value) =>
                setLocalSettings({
                  ...(editable as DoctorAiAssistantSettings),
                  permissions: { ...(editable?.permissions as Record<string, boolean>), require_human_handoff_on_clinical_questions: value },
                })
              }
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} size="sm">
              Salvar configuracoes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulate */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Simular conversa</CardTitle>
          <CardDescription className="text-xs">Teste operacional do fluxo IA + WhatsApp + n8n.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input value={simulatePhone} onChange={(e) => setSimulatePhone(e.target.value)} placeholder="Telefone do paciente" className="h-9 sm:w-[200px]" />
            <Input value={simulateMessage} onChange={(e) => setSimulateMessage(e.target.value)} placeholder="Mensagem do paciente" className="h-9 flex-1" />
            <Button onClick={() => simulateMutation.mutate()} disabled={simulateMutation.isPending || !simulateMessage || !simulatePhone} size="sm">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="border-border/50 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Historico de interacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {((interactionsQuery.data as DoctorAiInteraction[] | undefined) ?? []).map((item) => (
            <div key={item.id} className={cn("rounded-xl border border-border/50 p-3 text-sm", item.direction === 0 ? "bg-muted/20" : "bg-primary/[0.03]")}>
              <div className="mb-1 flex items-center justify-between">
                <Badge variant={item.direction === 0 ? "secondary" : "default"} className="text-[10px]">{item.direction === 0 ? "Entrada" : "Saida"}</Badge>
                <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">Paciente: {item.patient_phone}</p>
              <p className="mt-1 text-sm">{item.message_text}</p>
            </div>
          ))}
          {(interactionsQuery.data as DoctorAiInteraction[] | undefined)?.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem interacoes ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DoctorAiAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ia");
  const [simulatePhone, setSimulatePhone] = useState("");
  const [simulateMessage, setSimulateMessage] = useState("");

  const subscriptionQuery = useQuery({
    queryKey: ["doctor-subscription"],
    queryFn: async () => (await doctorBillingApi.subscription()).data,
  });

  const hasAiModule = Boolean(subscriptionQuery.data?.includes_ai_chatbot);

  const settingsQuery = useQuery({
    queryKey: ["doctor-ai-settings"],
    queryFn: async () => (await doctorAiAssistantApi.get()).data,
    enabled: hasAiModule,
    retry: false,
  });

  const interactionsQuery = useQuery({
    queryKey: ["doctor-ai-interactions"],
    queryFn: async () => (await doctorAiAssistantApi.interactions(25)).data,
    enabled: hasAiModule && settingsQuery.isSuccess,
    retry: false,
  });

  const settings = settingsQuery.data;
  const [localSettings, setLocalSettings] = useState<DoctorAiAssistantSettings | null>(null);
  const editable = useMemo(() => localSettings ?? settings ?? null, [localSettings, settings]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor-ai-settings"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-ai-interactions"] });
  };

  const updateMutation = useMutation({
    mutationFn: async () => (await doctorAiAssistantApi.updateSettings({
      whatsapp_number: editable?.whatsapp_number,
      timezone: editable?.timezone,
      working_hours: editable?.working_hours,
      auto_messages: editable?.auto_messages,
      allowed_flows: editable?.allowed_flows,
      permissions: editable?.permissions,
    })).data,
    onSuccess: () => { toast.success("Configuracoes atualizadas."); setLocalSettings(null); refresh(); },
    onError: () => toast.error("Nao foi possivel salvar as configuracoes."),
  });

  const statusMutation = useMutation({
    mutationFn: async (action: "activate" | "pause" | "cancel") => (await doctorAiAssistantApi.updateStatus(action)).data,
    onSuccess: () => refresh(),
    onError: () => toast.error("Falha ao atualizar status."),
  });

  const simulateMutation = useMutation({
    mutationFn: async () => (await doctorAiAssistantApi.simulate({ patient_phone: simulatePhone, message: simulateMessage })).data,
    onSuccess: () => { toast.success("Simulacao executada."); setSimulateMessage(""); refresh(); },
    onError: (error) => {
      const info = getApiErrorInfo(error);
      toast.error(info.detail || "Falha na simulacao.");
    },
  });

  if (subscriptionQuery.isLoading) {
    return <div className="page-container"><p className="text-sm text-muted-foreground">Carregando assinatura...</p></div>;
  }

  if (!hasAiModule) {
    return (
      <div className="page-container">
        <Card className="border-border/50 shadow-card">
          <CardHeader>
            <CardTitle>IA + Chatbot indisponivel</CardTitle>
            <CardDescription>Seu plano atual nao inclui este modulo. Atualize seu plano na aba Perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/doctor/profile")}>Ir para perfil</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (settingsQuery.isLoading) {
    return <div className="page-container"><p className="text-sm text-muted-foreground">Carregando assistente IA...</p></div>;
  }

  if (settingsQuery.isError) {
    const errorInfo = getApiErrorInfo(settingsQuery.error);
    return (
      <div className="page-container">
        <SetupPendingState detail={errorInfo.detail} onRetry={refresh} onOpenProfile={() => navigate("/doctor/profile")} />
      </div>
    );
  }

  return (
    <div className="page-container space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">IA + Chatbot</Badge>
            <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[settings?.status ?? 0]}</Badge>
          </div>
          <h1 className="text-lg font-semibold sm:text-xl">Assistente inteligente</h1>
          <p className="text-sm text-muted-foreground">Gerencie IA e automacoes do chatbot em um so lugar.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="ia" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            IA
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-3.5 w-3.5" />
            ChatBot
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ia" className="mt-4">
          <AiWorkspaceTab settings={settings} />
        </TabsContent>

        <TabsContent value="chatbot" className="mt-4">
          <ChatBotConfigTab
            settings={settings}
            editable={editable}
            setLocalSettings={setLocalSettings}
            updateMutation={updateMutation}
            statusMutation={statusMutation}
            simulatePhone={simulatePhone}
            setSimulatePhone={setSimulatePhone}
            simulateMessage={simulateMessage}
            setSimulateMessage={setSimulateMessage}
            simulateMutation={simulateMutation}
            interactionsQuery={interactionsQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
