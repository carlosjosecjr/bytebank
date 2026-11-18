import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

interface CacheEntry {
  expiresAt: number;
  response: HttpResponse<unknown>;
}

/** Cache em memória das respostas GET (TTL + requisições em voo compartilhadas). */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Observable<HttpResponse<unknown>>>();

  get(key: string): HttpResponse<unknown> | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.response;
  }

  set(key: string, response: HttpResponse<unknown>, ttlMs: number): void {
    this.entries.set(key, { response, expiresAt: Date.now() + ttlMs });
  }

  getInFlight(key: string): Observable<HttpResponse<unknown>> | undefined {
    return this.inFlight.get(key);
  }

  setInFlight(key: string, request$: Observable<HttpResponse<unknown>>): void {
    this.inFlight.set(key, request$);
  }

  clearInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  /** Remove tudo cujo URL começa com o prefixo (ex.: `/api/account` após uma mutação). */
  invalidate(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
    this.inFlight.clear();
  }
}
