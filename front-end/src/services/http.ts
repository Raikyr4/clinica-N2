import axios from "axios";

export const http = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getErrorMessage(error: unknown, fallback = "Nao foi possivel concluir a operacao.") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { mensagem?: string; message?: string } | undefined;
    return data?.mensagem || data?.message || error.message || fallback;
  }

  return fallback;
}
