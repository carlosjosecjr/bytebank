import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { SessionStore } from './core/auth/application/session.store';
import { PREFETCH_ON_SESSION } from './core/auth/application/prefetch';
import { AuthRepository } from './core/auth/domain/auth.repository';
import { HttpAuthRepository } from './core/auth/infrastructure/http-auth.repository';
import { authErrorInterceptor } from './core/http/auth-error.interceptor';
import { cacheInterceptor } from './core/http/cache.interceptor';
import { SmartPreloadingStrategy } from './core/routing/smart-preloading.strategy';
import { accountPrefetch } from './features/account/infrastructure/account.prefetch';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withPreloading(SmartPreloadingStrategy),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Ordem importa: o cache responde antes; o tratamento de 401 vê as respostas reais.
    provideHttpClient(withFetch(), withInterceptors([cacheInterceptor, authErrorInterceptor])),
    { provide: AuthRepository, useExisting: HttpAuthRepository },
    { provide: PREFETCH_ON_SESSION, useFactory: () => [accountPrefetch()] },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },
    // Restaura a sessão (cookie httpOnly -> /user/me) antes da primeira navegação.
    provideAppInitializer(() => inject(SessionStore).restore()),
  ],
};
