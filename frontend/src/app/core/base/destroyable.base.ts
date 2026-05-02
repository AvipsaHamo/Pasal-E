// core/base/destroyable.base.ts
// Extend this instead of implementing OnDestroy manually everywhere.
// Call this.destroy$ with takeUntil() in every long-lived subscription.
import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export abstract class DestroyableComponent implements OnDestroy {
  protected readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
