import { HttpContextToken, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, filter, finalize, of, shareReplay, tap } from 'rxjs';
import { HttpCacheService } from '../cache/http-cache.service';

/** TTL (ms) do cache para um GET. 0 = sem cache. Uso: `new HttpContext().set(CACHE_TTL, 30_000)`. */
export const CACHE_TTL = new HttpContextToken<number>(() => 0);

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** `/api/account/transaction/1` -> `/api/account` */
export function resourcePrefix(url: string): string {
  const path = url.split('?')[0];
  return path.split('/').slice(0, 3).join('/');
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(HttpCacheService);

  if (MUTATIONS.has(req.method)) {
    return next(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) cache.invalidate(resourcePrefix(req.urlWithParams));
      }),
    );
  }

  const ttl = req.context.get(CACHE_TTL);
  if (req.method !== 'GET' || ttl <= 0) return next(req);

  const key = req.urlWithParams;
  const cached = cache.get(key);
  if (cached) return of(cached.clone());

  const inFlight = cache.getInFlight(key);
  if (inFlight) return inFlight as Observable<HttpEvent<unknown>>;

  const request$ = next(req).pipe(
    filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
    tap((response) => cache.set(key, response, ttl)),
    finalize(() => cache.clearInFlight(key)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  cache.setInFlight(key, request$);
  return request$;
};
