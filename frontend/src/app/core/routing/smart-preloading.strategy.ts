import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, Subject, filter, mergeMap, take, timer } from 'rxjs';

/**
 * Pré-carregamento sob demanda dos chunks lazy:
 * - `data: { preload: 'idle' }`  -> baixa logo após o boot, quando o navegador fica ocioso;
 * - `data: { preload: 'hover' }` -> baixa quando o usuário sinaliza intenção (hover/foco no link);
 * - sem `preload`                -> só ao navegar.
 */
@Injectable({ providedIn: 'root' })
export class SmartPreloadingStrategy implements PreloadingStrategy {
  private readonly intents$ = new Subject<string>();

  /** Chamado pela diretiva `bbPrefetch` com o caminho da rota (ex.: 'minha-conta'). */
  requestPreload(path: string): void {
    this.intents$.next(path.replace(/^\//, ''));
  }

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const mode = route.data?.['preload'];
    if (mode === 'idle') return timer(1500).pipe(mergeMap(load));
    if (mode === 'hover') {
      return this.intents$.pipe(
        filter((path) => path === route.path),
        take(1),
        mergeMap(load),
      );
    }
    return EMPTY;
  }
}
