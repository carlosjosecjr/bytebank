import { Directive, inject, input } from '@angular/core';
import { SmartPreloadingStrategy } from './smart-preloading.strategy';

/** `<a routerLink="/minha-conta" bbPrefetch="minha-conta">`: baixa o chunk ao passar o mouse/focar. */
@Directive({
  selector: '[bbPrefetch]',
  host: { '(mouseenter)': 'prefetch()', '(focus)': 'prefetch()', '(touchstart)': 'prefetch()' },
})
export class PrefetchDirective {
  readonly bbPrefetch = input.required<string>();
  private readonly strategy = inject(SmartPreloadingStrategy);
  private done = false;

  protected prefetch(): void {
    if (this.done) return;
    this.done = true;
    this.strategy.requestPreload(this.bbPrefetch());
  }
}
