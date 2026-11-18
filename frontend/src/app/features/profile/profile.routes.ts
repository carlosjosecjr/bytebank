import { Routes } from '@angular/router';
import { ProfileStore } from './application/profile.store';
import { ProfileRepository } from './domain/profile.repository';
import { HttpProfileRepository } from './infrastructure/http-profile.repository';

export default [
  {
    path: '',
    title: 'Minha conta | Bytebank',
    providers: [{ provide: ProfileRepository, useClass: HttpProfileRepository }, ProfileStore],
    loadComponent: () => import('./presentation/my-account.page').then((m) => m.MyAccountPage),
  },
] satisfies Routes;
