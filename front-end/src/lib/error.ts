import axios, { AxiosError } from "axios";
import type { APIError, ValidationError } from "@/types/api";

/**
 * Extrai mensagem de erro de uma resposta da API
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError | undefined;

    if (!apiError) {
      // Erro de rede ou sem resposta do servidor
      if (!error.response) {
        return "Erro ao conectar com o servidor. Verifique sua conexão.";
      }
      return "Erro desconhecido ao processar a requisição.";
    }

    // FastAPI HTTPException retorna { detail: string } ou { detail: ValidationError[] }
    if (typeof (apiError as any).detail === "string") {
      return (apiError as any).detail;
    }

    // Erros de validação do Pydantic
    if (Array.isArray((apiError as any).detail)) {
      const errors = (apiError as any).detail as ValidationError[];
      if (errors.length > 0) {
        // Retorna a primeira mensagem de erro
        return errors[0].msg;
      }
    }

    // Caso a API traga outro formato, tenta mensagem padrão de Axios
    return (
      (error.response?.statusText || error.message) ??
      "Erro desconhecido ao processar a requisição."
    );
  }

  // Erro genérico (Error object)
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
}

/**
 * Extrai erros de validação por campo
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError | undefined;

    if (apiError && Array.isArray((apiError as any).detail)) {
      const errors = (apiError as any).detail as ValidationError[];

      errors.forEach((err) => {
        // err.loc é um array como ["body", "email"] ou ["query", "limit"]
        // Pegamos o último item que é o nome do campo
        const loc = err.loc ?? [];
        const field = loc[loc.length - 1];
        if (typeof field === "string") {
          fieldErrors[field] = err.msg;
        }
      });
    }
  }

  return fieldErrors;
}

/**
 * Verifica se é erro de autenticação (401)
 */
export function isAuthError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/**
 * Verifica se é erro de validação (422)
 */
export function isValidationError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 422;
}

/**
 * Verifica se é erro de conflito (400)
 */
export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 400;
}

/**
 * Verifica se é erro de permissão (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

/**
 * Verifica se é erro de não encontrado (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * Trata erro de forma abrangente e retorna objeto com informações úteis
 * (Nunca lança exceção)
 */
export function handleAPIError(error: unknown) {
  let status: number | undefined;
  if (axios.isAxiosError(error)) status = error.response?.status;

  return {
    message: extractErrorMessage(error),
    fieldErrors: extractFieldErrors(error),
    isAuth: isAuthError(error),
    isValidation: isValidationError(error),
    isConflict: isConflictError(error),
    isForbidden: isForbiddenError(error),
    isNotFound: isNotFoundError(error),
    statusCode: status,
  };
}

/**
 * Mensagens de erro traduzidas comuns
 */
export const ERROR_MESSAGES = {
  NETWORK: "Erro ao conectar com o servidor. Verifique sua conexão.",
  UNAUTHORIZED: "Email ou senha incorretos.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "Recurso não encontrado.",
  VALIDATION: "Erro de validação. Verifique os campos.",
  CONFLICT: "Já existe um registro com estes dados.",
  SERVER: "Erro no servidor. Tente novamente mais tarde.",
  UNKNOWN: "Erro desconhecido. Tente novamente.",
} as const;

/**
 * Obtém mensagem de erro apropriada baseada no código de status
 */
export function getErrorMessageByStatus(statusCode?: number): string {
  if (!statusCode) return ERROR_MESSAGES.NETWORK;

  const statusMessages: Record<number, string> = {
    400: ERROR_MESSAGES.CONFLICT,
    401: ERROR_MESSAGES.UNAUTHORIZED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    422: ERROR_MESSAGES.VALIDATION,
    500: ERROR_MESSAGES.SERVER,
    502: ERROR_MESSAGES.SERVER,
    503: ERROR_MESSAGES.SERVER,
  };

  return statusMessages[statusCode] || ERROR_MESSAGES.UNKNOWN;
}
