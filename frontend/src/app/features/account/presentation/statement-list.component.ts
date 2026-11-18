import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InfiniteScrollDirective } from '../../../shared/ui/infinite-scroll.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatementGroup, TRANSACTION_KIND_LABEL, Transaction, signedAmount } from '../domain/transaction';

@Component({
  selector: 'bb-statement-list',
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, MatProgressSpinnerModule,
    InfiniteScrollDirective, CurrencyPipe, DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" class="statement">
      <mat-card-header>
        <mat-card-title>Extrato</mat-card-title>
      </mat-card-header>
      @if (loading()) { <mat-progress-bar mode="indeterminate" aria-label="Carregando extrato" /> }
      <mat-card-content>
        @for (group of groups(); track group.key) {
          <section>
            <h3 class="month">{{ group.label }}</h3>
            @for (tx of group.items; track tx.id) {
              <article class="item">
                <div class="row">
                  <span>{{ labels[tx.kind] }}</span>
                  <time class="date" [attr.datetime]="tx.createdAt.toISOString()">{{ tx.createdAt | date: 'dd/MM/yyyy' }}</time>
                </div>
                @if (tx.kind === 'transfer') { <span class="party">Para: {{ tx.to }}</span> }
                <div class="row">
                  <strong [class.negative]="value(tx) < 0">{{ value(tx) | currency }}</strong>
                  @if (editable()) {
                    <span class="actions">
                      <button mat-icon-button matTooltip="Editar" aria-label="Editar transação" (click)="edit.emit(tx)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Excluir" aria-label="Excluir transação" (click)="remove.emit(tx)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </span>
                  }
                </div>
              </article>
            }
          </section>
        } @empty {
          @if (!loading()) { <p class="empty">{{ emptyMessage() }}</p> }
        }

        @if (hasMore()) {
          <!-- Rolagem infinita: o sentinela pede a próxima página ao entrar na tela; o botão é a alternativa acessível. -->
          <div class="sentinel" aria-hidden="true"
               (bbInfiniteScroll)="loadMore.emit()"
               [bbInfiniteScrollVersion]="loaded()"
               [bbInfiniteScrollDisabled]="loading() || loadingMore()"></div>
          <div class="more">
            @if (loadingMore()) {
              <mat-spinner diameter="28" aria-label="Carregando mais transações" />
            } @else {
              <button mat-stroked-button (click)="loadMore.emit()">Carregar mais</button>
            }
          </div>
        }
        @if (total() > 0) {
          <p class="count" aria-live="polite">Exibindo {{ loaded() }} de {{ total() }} transações</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .statement { height: 100%; }
    .month { margin: 16px 0 4px; font: var(--mat-sys-label-large); color: var(--bb-green); }
    .item { padding: 8px 0; border-bottom: 1px solid var(--bb-green-soft); display: flex; flex-direction: column; gap: 2px; }
    .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .date, .party { font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
    .negative { color: var(--mat-sys-error); }
    .actions { display: flex; }
    .empty { color: var(--mat-sys-on-surface-variant); padding-top: 16px; }
    .sentinel { height: 1px; }
    .more { display: flex; justify-content: center; padding: 12px 0 4px; min-height: 40px; }
    .count { margin: 8px 0 0; text-align: center; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
  `,
})
export class StatementListComponent {
  readonly groups = input.required<StatementGroup[]>();
  readonly loading = input(false);
  readonly editable = input(true);
  readonly emptyMessage = input('Nenhuma transação por aqui ainda.');
  /** Paginação (rolagem infinita) */
  readonly hasMore = input(false);
  readonly loadingMore = input(false);
  readonly loaded = input(0);
  readonly total = input(0);
  readonly loadMore = output<void>();
  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();

  protected readonly labels = TRANSACTION_KIND_LABEL;
  protected readonly value = signedAmount;
}
