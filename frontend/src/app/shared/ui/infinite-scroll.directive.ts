import { DestroyRef, Directive, ElementRef, effect, inject, input, output } from '@angular/core';

/**
 * Coloque num elemento "sentinela" no fim de uma lista: emite `bbInfiniteScroll` quando ele entra na tela
 * (IntersectionObserver, sem escutar o scroll a cada frame).
 * `version` deve mudar a cada página carregada: o elemento é re-observado e, se o sentinela continuar
 * visível (lista curta, tela grande), pede a próxima página de novo.
 */
@Directive({ selector: '[bbInfiniteScroll]' })
export class InfiniteScrollDirective {
  readonly version = input<unknown>(null, { alias: 'bbInfiniteScrollVersion' });
  readonly disabled = input(false, { alias: 'bbInfiniteScrollDisabled' });
  /** Antecipa o carregamento antes de chegar exatamente ao fim. */
  readonly rootMargin = input('200px', { alias: 'bbInfiniteScrollMargin' });
  readonly bbInfiniteScroll = output<void>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private observer: IntersectionObserver | null = null;

  constructor() {
    effect(() => {
      this.version(); // re-observa a cada página
      this.observer?.disconnect();
      if (this.disabled() || typeof IntersectionObserver === 'undefined') return;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.bbInfiniteScroll.emit();
        },
        { rootMargin: this.rootMargin() },
      );
      this.observer.observe(this.element);
    });
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }
}
