import { Observable } from 'rxjs';
import { Credentials, Registration, User } from './user';

/** Contrato (porta) de autenticação. A implementação HTTP fica em infrastructure/. */
export abstract class AuthRepository {
  /** Autentica; a sessão fica num cookie httpOnly que o JS não lê. */
  abstract login(credentials: Credentials): Observable<void>;
  abstract register(data: Registration): Observable<User>;
  abstract currentUser(): Observable<User>;
  abstract logout(): Observable<void>;
}
