import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { CACHE_TTL } from '../../../core/http/cache.interceptor';
import { Account } from '../domain/account';
import { AccountRepository, PageRequest, Statement } from '../domain/account.repository';
import { NewTransaction, Transaction, TransactionChanges } from '../domain/transaction';
import { AccountDto, StatementDto, TransactionDto, toAccount, toApiType, toStatement, toTransaction } from './account.dto';

/** Leituras ficam 30s em cache (invalidado automaticamente por qualquer mutação em /account). */
const READ_CACHE = () => new HttpContext().set(CACHE_TTL, 30_000);

@Injectable({ providedIn: 'root' })
export class HttpAccountRepository extends AccountRepository {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  accounts(): Observable<Account[]> {
    return this.http
      .get<AccountDto[]>(`${this.api}/account`, { context: READ_CACHE() })
      .pipe(map((list) => list.map(toAccount)));
  }

  statement(accountId: string, { limit, offset }: PageRequest): Observable<Statement> {
    // Cada página tem URL própria (?limit&offset) e portanto entrada própria no cache HTTP.
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http
      .get<StatementDto>(`${this.api}/account/${encodeURIComponent(accountId)}/statement`, {
        params,
        context: READ_CACHE(),
      })
      .pipe(map(toStatement));
  }

  create(tx: NewTransaction, account: Account): Observable<Transaction> {
    const body = {
      accountId: tx.accountId,
      value: tx.amount,
      type: toApiType(tx.kind),
      ...this.parties(tx.kind, account, tx.recipient),
    };
    return this.http.post<TransactionDto>(`${this.api}/account/transaction`, body).pipe(map(toTransaction));
  }

  update(id: string, changes: TransactionChanges, account: Account): Observable<Transaction> {
    const body = {
      value: changes.amount,
      type: toApiType(changes.kind),
      ...this.parties(changes.kind, account, changes.recipient),
    };
    return this.http
      .put<TransactionDto>(`${this.api}/account/transaction/${encodeURIComponent(id)}`, body)
      .pipe(map(toTransaction));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(`${this.api}/account/transaction/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  /** A API exige origem/destino: depósito entra na própria conta, transferência sai dela. */
  private parties(kind: NewTransaction['kind'], account: Account, recipient?: string) {
    return kind === 'deposit'
      ? { from: 'Depósito', to: account.number }
      : { from: account.number, to: recipient?.trim() ?? '' };
  }
}
