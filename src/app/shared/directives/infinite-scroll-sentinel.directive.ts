//Angular
import { Directive, ElementRef, DestroyRef, afterNextRender, inject, output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScrollSentinel]',
})
export class InfiniteScrollSentinelDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = output<void>();

  constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible.emit();
        }
      });

      observer.observe(this.elementRef.nativeElement);

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
