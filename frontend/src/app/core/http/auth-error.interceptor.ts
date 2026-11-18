import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionEvents } from '../auth/session.events';

/** Rotas em que 401 é resposta esperada (credencial errada / sessão ainda não existe). */
const IGNORED = ['/user/auth', '/user/me', '/user/logout'];

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const events = inject(SessionEvents);
  return next(req).pipe(
    catchError((error: unknown) => {
      const ignored = IGNORED.some((path) => req.url.endsWith(path)) && req.method !== 'PUT';
      if (error instanceof HttpErrorResponse && error.status === 401 && !ignored) {
        events.unauthorized$.next();
      }
      return throwError(() => error);
    }),
  );
};
