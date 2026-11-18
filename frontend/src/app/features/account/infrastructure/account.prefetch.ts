import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { PrefetchTask } from '../../../core/auth/application/prefetch';
import { STATEMENT_PAGE_SIZE } from '../domain/account.repository';
import { HttpAccountRepository } from './http-account.repository';

/** Logo após o login, aquece o cache HTTP com contas + 1ª página do extrato: o dashboard abre já com dados. */
export function accountPrefetch(): PrefetchTask {
  const repo = inject(HttpAccountRepository);
  return () => {
    repo
      .accounts()
      .pipe(switchMap(([first]) => (first ? repo.statement(first.id, { limit: STATEMENT_PAGE_SIZE, offset: 0 }) : [])))
      .subscribe({ error: () => undefined });
  };
}
