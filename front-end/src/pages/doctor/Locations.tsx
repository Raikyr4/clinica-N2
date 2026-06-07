import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorLocationsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Pencil, Building2, Phone, Navigation, Globe } from "lucide-react";
import type { DoctorLocation } from "@/types/api";

type FormState = {
  nome: string;
  endereco: string;
  complemento: string;
  cidade: string;
  estado: string;
  telefone: string;
};

const emptyForm: FormState = { nome: "", endereco: "", complemento: "", cidade: "", estado: "", telefone: "" };

const BRAZIL_STATES = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

export default function DoctorLocations() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorLocation | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DoctorLocation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-locations"],
    queryFn: async () => (await doctorLocationsApi.list()).data,
  });

  const locations = useMemo(() => data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: async () => (await doctorLocationsApi.create({ ...form, estado: form.estado.toUpperCase() })).data,
    onSuccess: () => {
      toast.success("Localidade cadastrada!");
      queryClient.invalidateQueries({ queryKey: ["doctor-locations"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Falha ao cadastrar localidade.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("Localidade inválida");
      return (await doctorLocationsApi.update(editing.id, { ...form, estado: form.estado.toUpperCase() })).data;
    },
    onSuccess: () => {
      toast.success("Localidade atualizada!");
      queryClient.invalidateQueries({ queryKey: ["doctor-locations"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Falha ao atualizar localidade.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => doctorLocationsApi.remove(id),
    onSuccess: () => {
      toast.success("Localidade removida.");
      queryClient.invalidateQueries({ queryKey: ["doctor-locations"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "Falha ao remover localidade.");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (loc: DoctorLocation) => {
    setEditing(loc);
    setForm({
      nome: loc.nome,
      endereco: loc.endereco,
      complemento: loc.complemento || "",
      cidade: loc.cidade,
      estado: loc.estado,
      telefone: loc.telefone || "",
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.endereco.trim() || !form.cidade.trim() || !form.estado.trim()) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Localidades</h1>
            <p className="text-sm text-muted-foreground">
              {locations.length} {locations.length === 1 ? "local cadastrado" : "locais cadastrados"}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nova localidade
        </Button>
      </div>

      {/* Empty state */}
      {locations.length === 0 ? (
        <Card className="shadow-card border-border/60">
          <CardContent className="py-12">
            <EmptyState
              icon={Building2}
              title="Nenhuma localidade cadastrada"
              description="Adicione locais de atendimento para organizar sua agenda e facilitar a vida dos seus pacientes."
              actionLabel="Adicionar primeira localidade"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {locations.map((loc) => (
            <Card
              key={loc.id}
              className="shadow-card border-border/60 group hover:shadow-elevated transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{loc.nome}</h3>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{loc.estado}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(loc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(loc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Navigation className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm">{loc.endereco}</p>
                      {loc.complemento && <p className="text-xs text-muted-foreground">{loc.complemento}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm">{loc.cidade}, {loc.estado}</p>
                  </div>
                  {loc.telefone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm">{loc.telefone}</p>
                    </div>
                  )}
                </div>

                {/* Mobile actions */}
                <div className="flex gap-2 mt-4 md:hidden">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(loc)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteTarget(loc)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              {editing ? "Editar localidade" : "Nova localidade"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize as informações do local de atendimento."
                : "Preencha os dados do novo local de atendimento."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Nome do local <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: Clínica Centro, Consultório Setor Bueno"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Rua, número"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                placeholder="Sala, andar, bloco"
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Cidade <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>UF <span className="text-destructive">*</span></Label>
                <Select
                  value={form.estado || undefined}
                  onValueChange={(value) => setForm({ ...form, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZIL_STATES.map((state) => (
                      <SelectItem key={state.uf} value={state.uf}>
                        {state.uf} - {state.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(62) 99999-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover localidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
