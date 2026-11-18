import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { removeEntity, setAllEntities, setEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, catchError, concatMap, exhaustMap, filter, finalize, map, of, pipe, switchMap, tap } from 'rxjs';
import { errorMessage } from '../../../core/http/error-message';
import { SecureStorage } from '../../../core/security/secure-storage.service';
import { Account } from '../domain/account';
import { AccountRepository, STATEMENT_PAGE_SIZE, Statement } from '../domain/account.repository';
import { NewTransaction, Transaction, TransactionChanges, groupByMonth, signedAmount } from '../domain/transaction';
import {
  BusinessRuleError,
  CreateTransactionUseCase,
  DeleteTransactionUseCase,
  UpdateTransactionUseCase,
} from './transaction.use-cases';

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  loading: boolean;
  /** Carregando a próxima página (rolagem infinita). */
  loadingMore: boolean;
  saving: boolean;
  error: string | null;
  /** Total de transações no servidor (todas as páginas). */
  total: number;
}

/** Resultado de uma mutação para a tela (ex.: limpar o formulário só se deu certo). */
export type MutationResult = { ok: true } | { ok: false; message: string };

interface Mutation {
  run: () => Observable<unknown>;
  rollback?: () => void;
  resolve: (result: MutationResult) => void;
}

const SNAPSHOT = 'account.statement';

interface StatementSnapshot {
  account: Omit<Account, 'createdAt'> & { createdAt: string };
  transactions: (Omit<Transaction, 'createdAt'> & { createdAt: string })[];
  total: number;
}

const reviveSnapshot = (s: StatementSnapshot): Statement => ({
  account: { ...s.account, createdAt: new Date(s.account.createdAt) },
  transactions: s.transactions.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })),
  total: s.total ?? s.transactions.length,
});

const toMessage = (error: unknown) =>
  error instanceof BusinessRuleError ? error.message : errorMessage(error);

export const AccountStore = signalStore(
  withState<AccountState>({
    accounts: [],
    selectedAccountId: null,
    loading: false,
    loadingMore: false,
    saving: false,
    error: null,
    total: 0,
  }),
  withEntities<Transaction>(),
  withComputed(({ accounts, selectedAccountId, entities, total }) => {
    const account = computed(() => accounts().find((a) => a.id === selectedAccountId()) ?? accounts()[0] ?? null);
    return {
      account,
      balance: computed(() => account()?.balance ?? 0),
      statement: computed(() => groupByMonth(entities())),
      isEmpty: computed(() => entities().length === 0),
      loadedCount: computed(() => entities().length),
      hasMore: computed(() => entities().length < total()),
    };
  }),
  withMethods((store) => {
    const repo = inject(AccountRepository);
    const storage = inject(SecureStorage);
    const createUseCase = inject(CreateTransactionUseCase);
    const updateUseCase = inject(UpdateTransactionUseCase);
    const deleteUseCase = inject(DeleteTransactionUseCase);

    const applyStatement = (statement: Statement) => {
      const others = store.accounts().filter((a) => a.id !== statement.account.id);
      patchState(
        store,
        { accounts: [statement.account, ...others], selectedAccountId: statement.account.id, total: statement.total },
        setAllEntities([...statement.transactions]),
      );
    };

    const firstPage = { limit: STATEMENT_PAGE_SIZE, offset: 0 };

    const persistSnapshot = (statement: Statement) =>
      void storage.setItem(SNAPSHOT, {
        account: { ...statement.account, createdAt: statement.account.createdAt.toISOString() },
        transactions: statement.transactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
        total: statement.total,
      });

    /** Saldo é calculado no servidor: após mutação, rebusca a conta (cache já foi invalidado). */
    const refreshBalance = () =>
      repo.accounts().pipe(
        tap((accounts) => patchState(store, { accounts })),
        catchError(() => EMPTY),
      );

    /** Leitura reativa: switchMap cancela a carga anterior se outra começar. Recomeça da 1ª página. */
    const load = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          repo.accounts().pipe(
            switchMap((accounts) => {
              patchState(store, { accounts });
              const selected = store.selectedAccountId() ?? accounts[0]?.id;
              return selected ? repo.statement(selected, firstPage) : of(null);
            }),
            tap((statement) => {
              if (!statement) return;
              applyStatement(statement);
              persistSnapshot(statement);
            }),
            catchError((error) => {
              patchState(store, { error: errorMessage(error, 'Não foi possível carregar o extrato.') });
              return EMPTY;
            }),
            finalize(() => patchState(store, { loading: false })),
          ),
        ),
      ),
    );

    /**
     * Próxima página (rolagem infinita). exhaustMap ignora novos disparos enquanto uma página carrega
     * (o sentinela pode aparecer várias vezes). O offset é o que já está na tela: criações/exclusões
     * locais já ajustaram essa contagem, e setEntities descarta repetidos se o servidor mudou no meio.
     */
    const loadMore = rxMethod<void>(
      pipe(
        filter(() => store.hasMore() && !store.loading() && !store.loadingMore() && !!store.account()),
        exhaustMap(() => {
          patchState(store, { loadingMore: true });
          const page = { limit: STATEMENT_PAGE_SIZE, offset: store.entities().length };
          return repo.statement(store.account()!.id, page).pipe(
            tap(({ transactions, total }) => patchState(store, setEntities([...transactions]), { total })),
            catchError((error) => {
              patchState(store, { error: errorMessage(error, 'Não foi possível carregar mais transações.') });
              return EMPTY;
            }),
            finalize(() => patchState(store, { loadingMore: false })),
          );
        }),
      ),
    );

    /** Escritas em fila (concatMap): nunca correm em paralelo nem se atropelam. */
    const mutate = rxMethod<Mutation>(
      pipe(
        concatMap((m) => {
          patchState(store, { saving: true });
          return m.run().pipe(
            concatMap(() => refreshBalance()),
            tap({ complete: () => m.resolve({ ok: true }) }),
            catchError((error) => {
              m.rollback?.();
              m.resolve({ ok: false, message: toMessage(error) });
              return EMPTY;
            }),
            finalize(() => patchState(store, { saving: false })),
          );
        }),
      ),
    );

    const enqueue = (m: Omit<Mutation, 'resolve'>) =>
      new Promise<MutationResult>((resolve) => mutate({ ...m, resolve }));

    const requireAccount = (): Account => {
      const account = store.account();
      if (!account) throw new BusinessRuleError('Conta não carregada.');
      return account;
    };

    return {
      load,
      loadMore,

      /** Mostra o último extrato salvo (cifrado) enquanto a API responde. */
      async hydrate(): Promise<void> {
        if (store.entities().length) return;
        const snapshot = await storage.getItem<StatementSnapshot>(SNAPSHOT);
        if (snapshot && !store.entities().length) applyStatement(reviveSnapshot(snapshot));
      },

      create(input: Omit<NewTransaction, 'accountId'>): Promise<MutationResult> {
        return enqueue({
          run: () => {
            const account = requireAccount();
            return createUseCase
              .execute({ ...input, accountId: account.id }, account)
              .pipe(tap((tx) => patchState(store, setEntity(tx), { total: store.total() + 1 })));
          },
        });
      },

      update(current: Transaction, changes: TransactionChanges): Promise<MutationResult> {
        return enqueue({
          run: () =>
            updateUseCase
              .execute(current, changes, requireAccount())
              .pipe(tap((tx) => patchState(store, setEntity(tx)))),
        });
      },

      /** Exclusão otimista: some da lista na hora; se a API falhar, volta (rollback). */
      remove(tx: Transaction): Promise<MutationResult> {
        const previousAccounts = store.accounts();
        const previousTotal = store.total();
        patchState(
          store,
          removeEntity(tx.id),
          {
            total: Math.max(0, previousTotal - 1),
            accounts: previousAccounts.map((a) =>
              a.id === tx.accountId ? { ...a, balance: a.balance - signedAmount(tx) } : a,
            ),
          },
        );
        return enqueue({
          run: () => deleteUseCase.execute(tx).pipe(map(() => undefined)),
          rollback: () => patchState(store, setEntity(tx), { accounts: previousAccounts, total: previousTotal }),
        });
      },
    };
  }),
  withHooks({
    onInit(store) {
      void store.hydrate();
      store.load();
    },
  }),
);
