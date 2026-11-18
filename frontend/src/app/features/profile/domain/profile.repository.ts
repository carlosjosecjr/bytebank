import { Observable } from 'rxjs';
import { User } from '../../../core/auth/domain/user';

export interface ProfileChanges {
  readonly name?: string;
  readonly email?: string;
  readonly password?: string;
}

export abstract class ProfileRepository {
  abstract update(changes: ProfileChanges): Observable<User>;
}
