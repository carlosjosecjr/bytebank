import { InjectionToken } from '@angular/core';

/** Tarefas de pré-carregamento de dados disparadas logo após o login / restauração da sessão.
 * Cada feature registra a sua (ex.: contas e extrato) via `multi` provider em app.config. */
export type PrefetchTask = () => void;
export const PREFETCH_ON_SESSION = new InjectionToken<PrefetchTask[]>('PREFETCH_ON_SESSION', {
  providedIn: 'root',
  factory: () => [],
});
