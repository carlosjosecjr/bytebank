import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionStore } from './application/session.store';

/** Rotas privadas: sem sessão, vai para o login guardando o destino. */
export const authGuard: CanMatchFn = (_route, segments) => {
  const session = inject(SessionStore);
  if (session.isAuthenticated()) return true;
  const returnUrl = '/' + segments.map((s) => s.path).join('/');
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl } });
};

/**
 * Login/cadastro só casam para quem NÃO está logado. Retorna `false` (e não um redirect) para que o
 * router siga para as próximas rotas: com sessão, /login cai no `**` e termina em /inicio.
 * (Um UrlTree aqui, num path '' que casa com qualquer URL, criaria loop de redirecionamento.)
 */
export const guestGuard: CanMatchFn = () => !inject(SessionStore).isAuthenticated();
