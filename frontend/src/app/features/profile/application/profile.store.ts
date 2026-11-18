import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../../core/auth/application/session.store';
import { errorMessage } from '../../../core/http/error-message';
import { ProfileChanges, ProfileRepository } from '../domain/profile.repository';

export const ProfileStore = signalStore(
  withState({ saving: false, error: null as string | null }),
  withMethods((store) => {
    const repo = inject(ProfileRepository);
    const session = inject(SessionStore);
    return {
      /** Salva e propaga o novo usuário para a sessão (cabeçalho, saudação, snapshot cifrado). */
      async save(changes: ProfileChanges): Promise<boolean> {
        patchState(store, { saving: true, error: null });
        try {
          session.setUser(await firstValueFrom(repo.update(changes)));
          return true;
        } catch (error) {
          patchState(store, { error: errorMessage(error) });
          return false;
        } finally {
          patchState(store, { saving: false });
        }
      },
    };
  }),
);
