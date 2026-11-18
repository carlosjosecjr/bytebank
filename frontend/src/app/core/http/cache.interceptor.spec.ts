import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CACHE_TTL, cacheInterceptor, resourcePrefix } from './cache.interceptor';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const cached = () => ({ context: new HttpContext().set(CACHE_TTL, 10_000) });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([cacheInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('serve o segundo GET do cache (uma única ida ao servidor)', async () => {
    const first = firstValueFrom(http.get('/api/account', cached()));
    backend.expectOne('/api/account').flush([{ id: '1' }]);
    expect(await first).toEqual([{ id: '1' }]);

    expect(await firstValueFrom(http.get('/api/account', cached()))).toEqual([{ id: '1' }]);
    backend.expectNone('/api/account');
  });

  it('compartilha requisições em voo (dedupe)', async () => {
    const a = firstValueFrom(http.get('/api/account', cached()));
    const b = firstValueFrom(http.get('/api/account', cached()));
    backend.expectOne('/api/account').flush([]);
    expect(await a).toEqual([]);
    expect(await b).toEqual([]);
  });

  it('invalida o recurso após uma mutação', async () => {
    const first = firstValueFrom(http.get('/api/account', cached()));
    backend.expectOne('/api/account').flush([]);
    await first;

    const post = firstValueFrom(http.post('/api/account/transaction', {}));
    backend.expectOne('/api/account/transaction').flush({});
    await post;

    const again = firstValueFrom(http.get('/api/account', cached()));
    backend.expectOne('/api/account').flush([{ id: '2' }]);
    expect(await again).toEqual([{ id: '2' }]);
  });

  it('não cacheia sem TTL', async () => {
    const a = firstValueFrom(http.get('/api/user/me'));
    backend.expectOne('/api/user/me').flush({});
    await a;
    const b = firstValueFrom(http.get('/api/user/me'));
    backend.expectOne('/api/user/me').flush({});
    await b;
  });

  it('calcula o prefixo do recurso', () => {
    expect(resourcePrefix('/api/account/transaction/1?x=1')).toBe('/api/account');
    expect(resourcePrefix('/api/user/me')).toBe('/api/user');
  });
});
