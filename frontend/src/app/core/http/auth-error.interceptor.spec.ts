import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionEvents } from '../auth/session.events';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let unauthorized: number;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authErrorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    unauthorized = 0;
    TestBed.inject(SessionEvents).unauthorized$.subscribe(() => unauthorized++);
  });

  it('avisa a sessão quando uma rota protegida responde 401', async () => {
    const req = firstValueFrom(http.get('/api/account')).catch(() => 'erro');
    backend.expectOne('/api/account').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(await req).toBe('erro');
    expect(unauthorized).toBe(1);
  });

  it('ignora 401 do login (senha errada não é sessão expirada)', async () => {
    const req = firstValueFrom(http.post('/api/user/auth', {})).catch(() => 'erro');
    backend.expectOne('/api/user/auth').flush(null, { status: 401, statusText: 'Unauthorized' });
    await req;
    expect(unauthorized).toBe(0);
  });
});
