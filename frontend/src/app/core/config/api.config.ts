import { InjectionToken } from '@angular/core';

/** Base da API. Em dev o proxy do `ng serve` e em produção o nginx encaminham `/api` para o FastAPI,
 * mantendo o front na mesma origem (requisito do cookie SameSite=Strict). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
