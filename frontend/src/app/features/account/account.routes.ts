import { Routes } from '@angular/router';
import { AccountStore } from './application/account.store';
import { TRANSACTION_USE_CASES } from './application/transaction.use-cases';
import { AccountRepository } from './domain/account.repository';
import { HttpAccountRepository } from './infrastructure/http-account.repository';

/** Composition root da feature: liga a porta (AccountRepository) à implementação HTTP.
 * O AccountStore é compartilhado entre Início e Transferências e vive enquanto a feature estiver ativa. */
export default [
  {
    path: '',
    providers: [{ provide: AccountRepository, useExisting: HttpAccountRepository }, ...TRANSACTION_USE_CASES, AccountStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Início | Bytebank',
        loadComponent: () => import('./presentation/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'transferencias',
        title: 'Transferências | Bytebank',
        data: { preload: 'hover' },
        loadComponent: () => import('./presentation/transfers.page').then((m) => m.TransfersPage),
      },
    ],
  },
] satisfies Routes;
