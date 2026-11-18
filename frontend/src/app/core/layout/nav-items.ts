export interface NavItem {
  readonly label: string;
  readonly path: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Início', path: 'inicio' },
  { label: 'Transferências', path: 'transferencias' },
  { label: 'Investimentos', path: 'investimentos' },
  { label: 'Outros serviços', path: 'outros-servicos' },
];
