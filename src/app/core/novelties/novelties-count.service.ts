import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { ProcessesService } from '../../data-access/processes.service';

@Injectable({ providedIn: 'root' })
export class NoveltiesCountService implements OnDestroy {
  private readonly processes = inject(ProcessesService);

  readonly count = signal(0);
  private pollTimer?: ReturnType<typeof setInterval>;

  startPolling(): void {
    if (this.pollTimer) return;
    this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 30_000);
  }

  stopPolling(): void {
    clearInterval(this.pollTimer);
    this.pollTimer = undefined;
  }

  refresh(): void {
    this.processes.listNovelties(1, 1).subscribe({
      next: (res) => this.count.set(res.total),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
