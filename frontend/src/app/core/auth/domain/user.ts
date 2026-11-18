/** Entidade de domínio: o usuário autenticado (sem detalhes da API). */
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly username: string | null;
}

export interface Credentials {
  readonly identifier: string; // e-mail ou usuário
  readonly password: string;
}

export interface Registration {
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

export function firstName(user: Pick<User, 'name'> | null): string {
  return user?.name.trim().split(/\s+/)[0] ?? '';
}
