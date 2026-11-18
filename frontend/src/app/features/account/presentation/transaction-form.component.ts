import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroupDirective, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSACTION_KIND_LABEL, TransactionKind } from '../domain/transaction';

export interface TransactionFormValue {
  kind: TransactionKind;
  amount: number;
  recipient?: string;
}

@Component({
  selector: 'bb-transaction-form',
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined">
      <mat-card-header><mat-card-title>{{ title() }}</mat-card-title></mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          @if (!fixedKind()) {
            <mat-form-field>
              <mat-label>Tipo de transação</mat-label>
              <mat-select formControlName="kind">
                @for (kind of kinds; track kind) {
                  <mat-option [value]="kind">{{ labels[kind] }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          @if (isTransfer()) {
            <mat-form-field>
              <mat-label>Destinatário</mat-label>
              <input matInput formControlName="recipient" maxlength="100" autocomplete="off" />
              @if (form.controls.recipient.hasError('required')) { <mat-error>Informe o destinatário.</mat-error> }
            </mat-form-field>
          }
          <mat-form-field>
            <mat-label>Valor</mat-label>
            <span matTextPrefix>R$&nbsp;</span>
            <input matInput type="number" inputmode="decimal" min="0.01" step="0.01" formControlName="amount" placeholder="0,00" />
            @if (form.controls.amount.hasError('min') || form.controls.amount.hasError('required')) {
              <mat-error>Informe um valor maior que zero.</mat-error>
            }
          </mat-form-field>
          <button mat-flat-button type="submit" [disabled]="saving()">
            {{ saving() ? 'Processando…' : 'Concluir transação' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .form { display: flex; flex-direction: column; max-width: 360px; padding-top: 16px; }
    button { align-self: flex-start; }
  `,
})
export class TransactionFormComponent {
  readonly title = input('Nova transação');
  /** Quando definido (ex.: tela de Transferências), o tipo fica fixo. */
  readonly fixedKind = input<TransactionKind | null>(null);
  readonly saving = input(false);
  readonly submitted = output<TransactionFormValue>();

  protected readonly kinds: TransactionKind[] = ['deposit', 'transfer'];
  protected readonly labels = TRANSACTION_KIND_LABEL;
  private readonly formDirective = viewChild.required(FormGroupDirective);

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    kind: this.fb.control<TransactionKind>('deposit', Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    recipient: this.fb.control(''),
  });

  private readonly kind = toSignal(this.form.controls.kind.valueChanges, { initialValue: this.form.controls.kind.value });
  protected readonly isTransfer = computed(() => (this.fixedKind() ?? this.kind()) === 'transfer');

  constructor() {
    effect(() => {
      const fixed = this.fixedKind();
      if (fixed) this.form.controls.kind.setValue(fixed);
    });
    // Destinatário só é obrigatório em transferência.
    effect(() => {
      const recipient = this.form.controls.recipient;
      recipient.setValidators(this.isTransfer() ? [Validators.required] : []);
      recipient.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { kind, amount, recipient } = this.form.getRawValue();
    this.submitted.emit({ kind, amount: Number(amount), recipient: kind === 'transfer' ? recipient : undefined });
  }

  /** Chamado pela página quando a transação foi aceita. */
  reset(): void {
    this.formDirective().resetForm({ kind: this.fixedKind() ?? 'deposit', amount: null, recipient: '' });
  }
}
