import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { AuthRepository } from '../domain/auth.repository';
import { Credentials, Registration, User } from '../domain/user';
import { UserDto, toUser } from './user.dto';

@Injectable({ providedIn: 'root' })
export class HttpAuthRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  login({ identifier, password }: Credentials): Observable<void> {
    // Fluxo OAuth2 "password" (form), o mesmo do Swagger; a API grava o cookie httpOnly.
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('username', identifier.trim())
      .set('password', password);
    return this.http.post(`${this.api}/user/auth`, body).pipe(map(() => undefined));
  }

  register(data: Registration): Observable<User> {
    return this.http.post<UserDto>(`${this.api}/user`, data).pipe(map(toUser));
  }

  currentUser(): Observable<User> {
    return this.http.get<UserDto>(`${this.api}/user/me`).pipe(map(toUser));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.api}/user/logout`, null);
  }
}
