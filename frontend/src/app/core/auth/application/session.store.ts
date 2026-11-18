import { DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { HttpCacheService } from '../../cache/http-cache.service';
import { SecureStorage } from '../../security/secure-storage.service';
import { AuthRepository } from '../domain/auth.repository';
import { Credentials, Registration, User, firstName } from '../domain/user';
import { SessionEvents } from '../session.events';
import { PREFETCH_ON_SESSION } from './prefetch';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
  user: User | null;
  status: SessionStatus;
}

const USER_SNAPSHOT = 'session.user';

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>({ user: null, status: 'unknown' }),
  withComputed(({ user, status }) => ({
    isAuthenticated: computed(() => status() === 'authenticated'),
    firstName: computed(() => firstName(user())),
  })),
  withMethods((store) => {
    const repo = inject(AuthRepository);
    const storage = inject(SecureStorage);
    const cache = inject(HttpCacheService);
    const router = inject(Router);
    const prefetchTasks = inject(PREFETCH_ON_SESSION);

    const authenticated = (user: User) => {
      patchState(store, { user, status: 'authenticated' });
      void storage.setItem(USER_SNAPSHOT, user);
    };

    const clearLocal = async () => {
      patchState(store, { user: null, status: 'anonymous' });
      cache.clear();
      await storage.clear();
    };

    const prefetch = () => prefetchTasks.forEach((task) => task());

    /** Sessão expirada/invalidada (401 em rota protegida ou revalidação falhou). */
    const expire = async (): Promise<void> => {
      if (store.status() === 'anonymous') return;
      const returnUrl = router.url;
      await clearLocal();
      await router.navigate(['/login'], { queryParams: { returnUrl, expired: 1 } });
    };

    const login = async (credentials: Credentials): Promise<void> => {
      await firstValueFrom(repo.login(credentials));
      const user = await firstValueFrom(repo.currentUser());
      cache.clear();
      authenticated(user);
      prefetch();
    };

    return {
      /**
       * Boot (app initializer). Stale-while-revalidate: com snapshot cifrado, a sessão abre na hora
       * e /user/me revalida em segundo plano. Sem snapshot, aguarda o /user/me.
       */
      async restore(): Promise<void> {
        const snapshot = await storage.getItem<User>(USER_SNAPSHOT);
        if (snapshot) patchState(store, { user: snapshot, status: 'authenticated' });

        const revalidate = firstValueFrom(repo.currentUser()).then(
          (user) => {
            authenticated(user);
            prefetch();
          },
          () => (snapshot ? expire() : clearLocal()),
        );
        if (!snapshot) await revalidate;
      },

      login,

      async register(data: Registration): Promise<void> {
        await firstValueFrom(repo.register(data));
        await login({ identifier: data.email, password: data.password });
      },

      /** Atualiza o usuário exibido (ex.: depois de salvar "Minha conta"). */
      setUser(user: User): void {
        authenticated(user);
      },

      async logout(): Promise<void> {
        await firstValueFrom(repo.logout()).catch(() => undefined);
        await clearLocal();
        await router.navigate(['/login']);
      },

      expire,
    };
  }),
  withHooks({
    onInit(store) {
      inject(SessionEvents)
        .unauthorized$.pipe(takeUntilDestroyed(inject(DestroyRef)))
        .subscribe(() => void store.expire());
    },
  }),
);
