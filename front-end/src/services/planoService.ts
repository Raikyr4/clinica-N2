import { http } from "./http";
import { PlanoSaude } from "@/types/Clinica";

export async function listarPlanos() {
  const { data } = await http.get<PlanoSaude[]>("/api/planos");
  return data;
}
