import { Account } from '../domain/account';
import { Statement } from '../domain/account.repository';
import { Transaction, TransactionKind } from '../domain/transaction';

/** Contratos da API FastAPI (camelCase via alias). Só esta camada conhece esses nomes. */
export interface AccountDto {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  createdAt: string;
}

export type ApiTransactionType = 'Credit' | 'Debit';

export interface TransactionDto {
  id: string;
  accountId: string;
  value: number;
  type: ApiTransactionType;
  from: string;
  to: string;
  anexo?: string | null;
  urlAnexo?: string | null;
  createdAt: string;
}

export interface StatementDto {
  account: AccountDto;
  transactions: TransactionDto[];
  total: number;
  limit: number | null;
  offset: number;
  hasMore: boolean;
}

export const toApiType = (kind: TransactionKind): ApiTransactionType =>
  kind === 'deposit' ? 'Credit' : 'Debit';

export const toKind = (type: string): TransactionKind =>
  type.toLowerCase() === 'credit' ? 'deposit' : 'transfer';

export const toAccount = (dto: AccountDto): Account => ({
  id: dto.id,
  number: dto.accountNumber,
  balance: dto.balance,
  createdAt: new Date(dto.createdAt),
});

export const toTransaction = (dto: TransactionDto): Transaction => ({
  id: dto.id,
  accountId: dto.accountId,
  kind: toKind(dto.type),
  amount: dto.value,
  from: dto.from,
  to: dto.to,
  createdAt: new Date(dto.createdAt),
});

export const toStatement = (dto: StatementDto): Statement => ({
  account: toAccount(dto.account),
  transactions: dto.transactions.map(toTransaction),
  total: dto.total,
});
