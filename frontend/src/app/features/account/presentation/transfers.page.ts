import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { AccountStore } from '../application/account.store';
import { StatementListComponent } from './statement-list.component';
import { TransactionActions } from './transaction-actions';
import { TransactionFormComponent, TransactionFormValue } from './transaction-form.component';
import { BalanceCardComponent } from './balance-card.component';
import { SessionStore } from '../../../core/auth/application/session.store';

@Component({
  selector: 'bb-transfers-page',
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
        <bb-transaction-form title="Nova transferência" fixedKind="transfer" [saving]="store.saving()" (submitted)="transfer($event)" />
      </div>
      <aside class="side">
        <bb-statement-list
          [groups]="transfers()"
          [loading]="store.loading()"
          [hasMore]="store.hasMore()"
          [loadingMore]="store.loadingMore()"
          [loaded]="store.loadedCount()"
          [total]="store.total()"
          (loadMore)="store.loadMore()"
          emptyMessage="Nenhuma transferência nas transações carregadas."
          (edit)="actions.edit($event)"
          (remove)="actions.remove($event)" />
      </aside>
    </div>
  `,
})
export class TransfersPage {
  protected readonly session = inject(SessionStore);
  protected readonly store = inject(AccountStore);
  protected readonly actions = inject(TransactionActions);
  private readonly form = viewChild.required(TransactionFormComponent);

  /** Extrato filtrado: só transferências (estado derivado, sem nova requisição). */
  protected readonly transfers = computed(() =>
    this.store
      .statement()
      .map((g) => ({ ...g, items: g.items.filter((t) => t.kind === 'transfer') }))
      .filter((g) => g.items.length > 0),
  );

  protected async transfer(value: TransactionFormValue): Promise<void> {
    const result = await this.store.create(value);
    if (this.actions.feedback(result, 'Transferência realizada!')) this.form().reset();
  }
}
