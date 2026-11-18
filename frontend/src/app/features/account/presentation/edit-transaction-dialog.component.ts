import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TRANSACTION_KIND_LABEL, Transaction, TransactionChanges, TransactionKind } from '../domain/transaction';

@Component({
  selector: 'bb-edit-transaction-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Editar transação</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="fields">
        <mat-form-field>
          <mat-label>Tipo de transação</mat-label>
          <mat-select formControlName="kind">
            @for (kind of kinds; track kind) { <mat-option [value]="kind">{{ labels[kind] }}</mat-option> }
          </mat-select>
        </mat-form-field>
        @if (isTransfer()) {
          <mat-form-field>
            <mat-label>Destinatário</mat-label>
            <input matInput formControlName="recipient" maxlength="100" />
          </mat-form-field>
        }
        <mat-form-field>
          <mat-label>Valor</mat-label>
          <span matTextPrefix>R$&nbsp;</span>
          <input matInput type="number" inputmode="decimal" min="0.01" step="0.01" formControlName="amount" />
          <mat-error>Informe um valor maior que zero.</mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button type="submit">Salvar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.fields { display: flex; flex-direction: column; min-width: min(360px, 80vw); }`,
})
export class EditTransactionDialogComponent {
  private readonly tx = inject<Transaction>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EditTransactionDialogComponent, TransactionChanges>);

  protected readonly kinds: TransactionKind[] = ['deposit', 'transfer'];
  protected readonly labels = TRANSACTION_KIND_LABEL;
  protected readonly form = inject(NonNullableFormBuilder).group({
    kind: [this.tx.kind],
    amount: [this.tx.amount, [Validators.required, Validators.min(0.01)]],
    recipient: [this.tx.kind === 'transfer' ? this.tx.to : ''],
  });
  private readonly kind = toSignal(this.form.controls.kind.valueChanges, { initialValue: this.tx.kind });
  protected readonly isTransfer = computed(() => this.kind() === 'transfer');

  protected save(): void {
    if (this.form.invalid) return this.form.markAllAsTouched();
    const { kind, amount, recipient } = this.form.getRawValue();
    this.ref.close({ kind, amount: Number(amount), recipient: kind === 'transfer' ? recipient : undefined });
  }
}
