import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { SessionStore } from '../../../core/auth/application/session.store';
import { AccountStore } from '../application/account.store';
import { BalanceCardComponent } from './balance-card.component';
import { StatementListComponent } from './statement-list.component';
import { TransactionActions } from './transaction-actions';
import { TransactionFormComponent, TransactionFormValue } from './transaction-form.component';

@Component({
  selector: 'bb-dashboard-page',
  imports: [BalanceCardComponent, TransactionFormComponent, StatementListComponent],
  providers: [TransactionActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-grid">
      <div class="main">
        <bb-balance-card
          [firstName]="session.firstName()"
          [balance]="store.balance()"
          [accountNumber]="store.account()?.number ?? null" />
        <bb-transaction-form [saving]="store.saving()" (submitted)="create($event)" />
      </div>
      <aside class="side">
        @defer (on viewport; prefetch on idle) {
          <bb-statement-list
            [groups]="store.statement()"
            [loading]="store.loading()"
            [hasMore]="store.hasMore()"
            [loadingMore]="store.loadingMore()"
            [loaded]="store.loadedCount()"
            [total]="store.total()"
            (loadMore)="store.loadMore()"
            (edit)="actions.edit($event)"
            (remove)="actions.remove($event)" />
        } @placeholder {
          <div class="statement-placeholder" aria-hidden="true"></div>
        }
      </aside>
    </div>
  `,
})
export class DashboardPage {
  protected readonly session = inject(SessionStore);
  protected readonly store = inject(AccountStore);
  protected readonly actions = inject(TransactionActions);
  private readonly form = viewChild.required(TransactionFormComponent);

  protected async create(value: TransactionFormValue): Promise<void> {
    const result = await this.store.create(value);
    if (this.actions.feedback(result, 'Transação concluída!')) this.form().reset();
  }
}
