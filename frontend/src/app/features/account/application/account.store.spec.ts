import { TestBed } from '@angular/core/testing';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';
import { KEY_STORE } from '../../../core/security/key-store';
import { Account } from '../domain/account';
import { AccountRepository, PageRequest, STATEMENT_PAGE_SIZE, Statement } from '../domain/account.repository';
import { NewTransaction, Transaction, TransactionChanges } from '../domain/transaction';
import { AccountStore } from './account.store';
import { TRANSACTION_USE_CASES } from './transaction.use-cases';

const account: Account = { id: 'a1', number: '0001', balance: 1000, createdAt: new Date() };
const deposit: Transaction = {
  id: 't1', accountId: 'a1', kind: 'deposit', amount: 150, from: 'Depósito', to: '0001', createdAt: new Date('2026-11-18'),
};

class FakeAccountRepository extends AccountRepository {
  balance = 1000;
  failDelete = false;
  /** Extrato do "servidor", mais recentes primeiro. */
  server: Transaction[] = [deposit];
  pages: PageRequest[] = [];
  accounts(): Observable<Account[]> { return of([{ ...account, balance: this.balance }]); }
  statement(_id: string, page: PageRequest): Observable<Statement> {
    this.pages.push(page);
    return of({
      account: { ...account, balance: this.balance },
      transactions: this.server.slice(page.offset, page.offset + page.limit),
      total: this.server.length,
    });
  }
  create(tx: NewTransaction): Observable<Transaction> {
    this.balance += tx.kind === 'deposit' ? tx.amount : -tx.amount;
    return of({ ...deposit, id: 't2', kind: tx.kind, amount: tx.amount, to: tx.recipient ?? '0001' });
  }
  update(id: string, changes: TransactionChanges): Observable<Transaction> { return of({ ...deposit, id, ...changes }); }
  remove(): Observable<void> {
    return this.failDelete ? timer(0).pipe(switchMap(() => throwError(() => new Error('falhou')))) : of(undefined);
  }
}

const many = (n: number): Transaction[] =>
  Array.from({ length: n }, (_, i) => ({
    ...deposit,
    id: `p${i}`,
    amount: i + 1,
    createdAt: new Date(Date.UTC(2026, 10, 30) - i * 3_600_000),
  }));

describe('AccountStore', () => {
  let store: InstanceType<typeof AccountStore>;
  let repo: FakeAccountRepository;

  function setup(server?: Transaction[]) {
    repo = new FakeAccountRepository();
    if (server) repo.server = server;
    TestBed.configureTestingModule({
      providers: [
        { provide: AccountRepository, useValue: repo },
        { provide: KEY_STORE, useValue: { load: async () => null, save: async () => undefined, remove: async () => undefined } },
        ...TRANSACTION_USE_CASES,
        AccountStore,
      ],
    });
    store = TestBed.inject(AccountStore);
  }

  beforeEach(() => setup());

  it('carrega conta e extrato agrupado', () => {
    expect(store.balance()).toBe(1000);
    expect(store.statement()[0].items.map((t) => t.id)).toEqual(['t1']);
  });

  it('cria transação e atualiza o saldo vindo do servidor', async () => {
    const result = await store.create({ kind: 'transfer', amount: 200, recipient: 'Ana' });
    expect(result.ok).toBe(true);
    expect(store.balance()).toBe(800);
    expect(store.entityMap()['t2'].kind).toBe('transfer');
  });

  it('bloqueia transferência sem saldo antes de chamar a API', async () => {
    const result = await store.create({ kind: 'transfer', amount: 5000, recipient: 'Ana' });
    expect(result).toEqual({ ok: false, message: 'Saldo insuficiente.' });
    expect(store.balance()).toBe(1000);
  });

  it('exclusão otimista com rollback quando a API falha', async () => {
    repo.failDelete = true;
    const pending = store.remove(deposit);
    // Some na hora (otimista), e o saldo já reflete a remoção
    expect(store.entityMap()['t1']).toBeUndefined();
    expect(store.balance()).toBe(850);

    const result = await pending;
    expect(result.ok).toBe(false);
    expect(store.entityMap()['t1']).toBeDefined();
    expect(store.balance()).toBe(1000);
  });

  describe('paginação (rolagem infinita)', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      setup(many(25));
    });

    it('carrega só a primeira página e sabe que há mais', () => {
      expect(store.loadedCount()).toBe(STATEMENT_PAGE_SIZE);
      expect(store.total()).toBe(25);
      expect(store.hasMore()).toBe(true);
      expect(repo.pages).toEqual([{ limit: STATEMENT_PAGE_SIZE, offset: 0 }]);
    });

    it('busca as próximas páginas até o fim, sem repetir', () => {
      store.loadMore();
      store.loadMore();
      expect(store.loadedCount()).toBe(25);
      expect(store.hasMore()).toBe(false);
      expect(repo.pages.map((p) => p.offset)).toEqual([0, 10, 20]);

      store.loadMore(); // já acabou: não chama a API
      expect(repo.pages).toHaveLength(3);
    });

    it('offset considera transação criada localmente (não pula nem repete)', async () => {
      const created = { ...deposit, id: 'novo', createdAt: new Date(Date.UTC(2026, 11, 1)) };
      repo.create = () => {
        repo.server = [created, ...repo.server];
        return of(created);
      };
      await store.create({ kind: 'deposit', amount: 5 });
      expect(store.total()).toBe(26);

      store.loadMore();
      // 11 na tela (10 + a nova) -> offset 11, que no servidor é exatamente o próximo item
      expect(repo.pages.at(-1)).toEqual({ limit: STATEMENT_PAGE_SIZE, offset: 11 });
      expect(store.loadedCount()).toBe(21);
      expect(new Set(store.ids()).size).toBe(21);
    });

    it('exclusão diminui o total', async () => {
      const first = store.entities()[0];
      await store.remove(first);
      expect(store.total()).toBe(24);
    });
  });
});
