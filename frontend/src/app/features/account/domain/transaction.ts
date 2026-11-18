/** Regras de negócio puras do extrato (sem Angular, sem HTTP). */

/** Depósito entra na conta (Credit); transferência sai (Debit). */
export type TransactionKind = 'deposit' | 'transfer';

export const TRANSACTION_KIND_LABEL: Record<TransactionKind, string> = {
  deposit: 'Depósito',
  transfer: 'Transferência',
};

export interface Transaction {
  readonly id: string;
  readonly accountId: string;
  readonly kind: TransactionKind;
  /** Sempre positivo; o sinal vem do tipo. */
  readonly amount: number;
  readonly from: string;
  readonly to: string;
  readonly createdAt: Date;
}

export interface NewTransaction {
  readonly accountId: string;
  readonly kind: TransactionKind;
  readonly amount: number;
  /** Destinatário da transferência. */
  readonly recipient?: string;
}

export interface TransactionChanges {
  readonly kind: TransactionKind;
  readonly amount: number;
  readonly recipient?: string;
}

export interface StatementGroup {
  readonly key: string; // 2026-11
  readonly label: string; // Novembro
  readonly items: readonly Transaction[];
}

export const signedAmount = (t: Pick<Transaction, 'kind' | 'amount'>): number =>
  t.kind === 'deposit' ? t.amount : -t.amount;

/** Valida antes de ir à API. Retorna a mensagem de erro ou null. */
export function validateTransaction(
  tx: Pick<NewTransaction, 'kind' | 'amount' | 'recipient'>,
  availableBalance: number,
): string | null {
  if (!Number.isFinite(tx.amount) || tx.amount <= 0) return 'Informe um valor maior que zero.';
  if (Math.round(tx.amount * 100) !== tx.amount * 100) return 'Use no máximo duas casas decimais.';
  if (tx.kind === 'transfer') {
    if (!tx.recipient?.trim()) return 'Informe o destinatário da transferência.';
    if (tx.amount > availableBalance) return 'Saldo insuficiente.';
  }
  return null;
}

const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'long' });
const MONTH_YEAR = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

/** Agrupa por mês (mais recente primeiro); mostra o ano só quando não é o ano corrente. */
export function groupByMonth(transactions: readonly Transaction[], now = new Date()): StatementGroup[] {
  const sorted = [...transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const groups = new Map<string, Transaction[]>();
  for (const tx of sorted) {
    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }
  return [...groups.entries()].map(([key, items]) => {
    const date = items[0].createdAt;
    const fmt = date.getFullYear() === now.getFullYear() ? MONTH : MONTH_YEAR;
    const label = fmt.format(date);
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1), items };
  });
}
