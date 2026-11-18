import { User } from '../domain/user';

/** Formato da API (FastAPI `UserResponse`). Só a infraestrutura conhece. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  username?: string | null;
}

export const toUser = (dto: UserDto): User => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  username: dto.username ?? null,
});
