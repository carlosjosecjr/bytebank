import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/ui/confirm-dialog.component';
import { AccountStore, MutationResult } from '../application/account.store';
import { Transaction, TransactionChanges } from '../domain/transaction';
import { EditTransactionDialogComponent } from './edit-transaction-dialog.component';

/** Orquestra os diálogos + feedback das ações do extrato (compartilhado por Início e Transferências). */
@Injectable()
export class TransactionActions {
  private readonly store = inject(AccountStore);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  feedback(result: MutationResult, success: string): boolean {
    this.snack.open(result.ok ? success : result.message, 'OK', { duration: result.ok ? 3000 : 6000 });
    return result.ok;
  }

  async edit(tx: Transaction): Promise<void> {
    const ref = this.dialog.open<EditTransactionDialogComponent, Transaction, TransactionChanges>(
      EditTransactionDialogComponent,
      { data: tx },
    );
    const changes = await firstValueFrom(ref.afterClosed());
    if (changes) this.feedback(await this.store.update(tx, changes), 'Transação atualizada.');
  }

  async remove(tx: Transaction): Promise<void> {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      data: { title: 'Excluir transação', message: 'Essa ação não pode ser desfeita. Deseja continuar?', confirmLabel: 'Excluir' },
    });
    if (await firstValueFrom(ref.afterClosed())) {
      this.feedback(await this.store.remove(tx), 'Transação excluída.');
    }
  }
}
