import { Observable } from 'rxjs';
import { Account } from './account';
import { NewTransaction, Transaction, TransactionChanges } from './transaction';

/** Uma página do extrato (mais recentes primeiro) + o total de transações da conta. */
export interface Statement {
  readonly account: Account;
  readonly transactions: readonly Transaction[];
  readonly total: number;
}

export interface PageRequest {
  readonly limit: number;
  readonly offset: number;
}

/** Tamanho da página do extrato (rolagem infinita). */
export const STATEMENT_PAGE_SIZE = 10;

/** Porta da feature de conta; implementada por HttpAccountRepository. */
export abstract class AccountRepository {
  abstract accounts(): Observable<Account[]>;
  abstract statement(accountId: string, page: PageRequest): Observable<Statement>;
  abstract create(tx: NewTransaction, account: Account): Observable<Transaction>;
  abstract update(id: string, changes: TransactionChanges, account: Account): Observable<Transaction>;
  abstract remove(id: string): Observable<void>;
}
