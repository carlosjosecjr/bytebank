import { Transaction, groupByMonth, signedAmount, validateTransaction } from './transaction';

const tx = (id: string, iso: string, kind: Transaction['kind'] = 'deposit', amount = 10): Transaction => ({
  id, accountId: 'a1', kind, amount, from: 'x', to: 'y', createdAt: new Date(iso),
});

describe('regras de transação', () => {
  it('sinal do valor vem do tipo', () => {
    expect(signedAmount({ kind: 'deposit', amount: 50 })).toBe(50);
    expect(signedAmount({ kind: 'transfer', amount: 50 })).toBe(-50);
  });

  it('valida valor, destinatário e saldo', () => {
    expect(validateTransaction({ kind: 'deposit', amount: 0 }, 100)).toMatch(/maior que zero/);
    expect(validateTransaction({ kind: 'deposit', amount: 10.555 }, 100)).toMatch(/duas casas/);
    expect(validateTransaction({ kind: 'transfer', amount: 10, recipient: ' ' }, 100)).toMatch(/destinatário/);
    expect(validateTransaction({ kind: 'transfer', amount: 150, recipient: 'Ana' }, 100)).toMatch(/Saldo/);
    expect(validateTransaction({ kind: 'deposit', amount: 150 }, 100)).toBeNull();
    expect(validateTransaction({ kind: 'transfer', amount: 99.9, recipient: 'Ana' }, 100)).toBeNull();
  });

  it('agrupa por mês, mais recente primeiro', () => {
    const groups = groupByMonth(
      [tx('1', '2026-10-05T12:00:00'), tx('2', '2026-11-18T12:00:00'), tx('3', '2026-11-21T12:00:00'), tx('4', '2025-11-02T12:00:00')],
      new Date('2026-11-25T12:00:00'),
    );
    expect(groups.map((g) => g.label)).toEqual(['Novembro', 'Outubro', 'Novembro de 2025']);
    expect(groups[0].items.map((t) => t.id)).toEqual(['3', '2']);
  });
});
