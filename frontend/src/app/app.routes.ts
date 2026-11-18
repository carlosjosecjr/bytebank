import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/guards';

/** Toda feature é lazy (um chunk por feature); a estratégia de preload decide quando baixar cada uma. */
export const routes: Routes = [
  // Sem isso, "/" casaria com o grupo de login (path '' sem filho vazio) e renderizaria uma página em branco.
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: '',
    canMatch: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./core/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        data: { preload: 'idle' },
        loadChildren: () => import('./features/account/account.routes'),
      },
      {
        path: 'minha-conta',
        data: { preload: 'hover' },
        loadChildren: () => import('./features/profile/profile.routes'),
      },
      {
        path: 'investimentos',
        title: 'Investimentos | Bytebank',
        data: { preload: 'hover', section: 'Investimentos' },
        loadComponent: () => import('./features/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
      },
      {
        path: 'outros-servicos',
        title: 'Outros serviços | Bytebank',
        data: { preload: 'hover', section: 'Outros serviços' },
        loadComponent: () => import('./features/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
