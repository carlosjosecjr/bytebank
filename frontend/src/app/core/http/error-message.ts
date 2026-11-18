import { HttpErrorResponse } from '@angular/common/http';

/** Converte erros HTTP em mensagens para o usuário (sem vazar detalhes técnicos). */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  switch (error.status) {
    case 0:
      return 'Sem conexão com o servidor.';
    case 401:
      return 'Usuário ou senha inválidos.';
    case 403:
      return 'Você não tem permissão para esta operação.';
    case 404:
      return 'Registro não encontrado.';
    case 409:
      return 'Já existe um cadastro com esses dados.';
    case 400:
    case 422:
      return typeof error.error?.detail === 'string' ? translate(error.error.detail) : 'Dados inválidos.';
    default:
      return fallback;
  }
}

const KNOWN: Record<string, string> = {
  'Insufficient balance': 'Saldo insuficiente.',
};

function translate(detail: string): string {
  const key = Object.keys(KNOWN).find((k) => detail.toLowerCase().includes(k.toLowerCase()));
  return key ? KNOWN[key] : detail;
}
