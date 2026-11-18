import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bb-balance-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="balance" appearance="filled">
      <mat-card-content class="content">
        <div>
          <h2 class="greeting">Olá, {{ firstName() || 'cliente' }}! :)</h2>
          <p class="date">{{ today | date: "EEEE, dd/MM/yyyy" }}</p>
        </div>
        <div class="saldo">
          <div class="saldo-header">
            <span>Saldo</span>
            <button mat-icon-button (click)="hidden.set(!hidden())"
                    [attr.aria-label]="hidden() ? 'Mostrar saldo' : 'Ocultar saldo'">
              <mat-icon>{{ hidden() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          <span class="label">Conta Corrente @if (accountNumber()) { · {{ accountNumber() }} }</span>
          <strong class="value" aria-live="polite">
            @if (hidden()) { R$ ••••• } @else { {{ balance() | currency }} }
          </strong>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .balance { background: var(--bb-petrol); color: #fff; min-height: 220px; }
    .content { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px; padding: 8px; }
    .greeting { margin: 0 0 8px; font: var(--mat-sys-headline-small); }
    .date { margin: 0; font: var(--mat-sys-body-small); }
    .date::first-letter { text-transform: uppercase; }
    .saldo { min-width: 200px; display: flex; flex-direction: column; gap: 4px; align-self: center; }
    .saldo-header { display: flex; align-items: center; gap: 8px; font: var(--mat-sys-title-medium);
      border-bottom: 2px solid var(--bb-accent); }
    .saldo-header button { color: var(--bb-accent); }
    .label { font: var(--mat-sys-body-medium); opacity: .9; }
    .value { font: var(--mat-sys-headline-medium); }
  `,
})
export class BalanceCardComponent {
  readonly firstName = input('');
  readonly balance = input(0);
  readonly accountNumber = input<string | null>(null);
  protected readonly hidden = signal(false);
  protected readonly today = new Date();
}
