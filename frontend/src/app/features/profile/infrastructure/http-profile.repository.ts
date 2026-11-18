import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { User } from '../../../core/auth/domain/user';
import { UserDto, toUser } from '../../../core/auth/infrastructure/user.dto';
import { ProfileChanges, ProfileRepository } from '../domain/profile.repository';

@Injectable()
export class HttpProfileRepository extends ProfileRepository {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  update(changes: ProfileChanges): Observable<User> {
    return this.http.put<UserDto>(`${this.api}/user/me`, changes).pipe(map(toUser));
  }
}
