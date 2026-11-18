import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Account } from '../domain/account';
import { AccountRepository } from '../domain/account.repository';
import { NewTransaction, Transaction, TransactionChanges, signedAmount, validateTransaction } from '../domain/transaction';

/** Erro de regra de negócio (validação local, antes da API). */
export class BusinessRuleError extends Error {}

@Injectable()
export class CreateTransactionUseCase {
  private readonly repo = inject(AccountRepository);

  execute(tx: NewTransaction, account: Account): Observable<Transaction> {
    const error = validateTransaction(tx, account.balance);
    return error ? throwError(() => new BusinessRuleError(error)) : this.repo.create(tx, account);
  }
}

@Injectable()
export class UpdateTransactionUseCase {
  private readonly repo = inject(AccountRepository);

  execute(current: Transaction, changes: TransactionChanges, account: Account): Observable<Transaction> {
    // O saldo disponível desconsidera o efeito da própria transação que está sendo editada.
    const available = account.balance - signedAmount(current);
    const error = validateTransaction(changes, available);
    return error ? throwError(() => new BusinessRuleError(error)) : this.repo.update(current.id, changes, account);
  }
}

@Injectable()
export class DeleteTransactionUseCase {
  private readonly repo = inject(AccountRepository);

  execute(tx: Transaction): Observable<void> {
    return this.repo.remove(tx.id);
  }
}

export const TRANSACTION_USE_CASES = [CreateTransactionUseCase, UpdateTransactionUseCase, DeleteTransactionUseCase];
