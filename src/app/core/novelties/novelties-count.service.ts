import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { ProcessesService } from '../../data-access/processes.service';

/** Backup refresh while the tab stays open and visible — the sync engine runs every ~15 min. */
const BACKUP_REFRESH_MS = 5 * 60 * 1000;

/**
 * Singleton owning the novelties badge count. Event-driven, not a background poller:
 * refreshes on start(), on tab focus (visibilitychange), and via a 5-min backup timer
 * that only runs while the tab is visible. See blueprint §7.2.1.
 */
@Injectable({ providedIn: 'root' })
export class NoveltiesCountService implements OnDestroy {
  private readonly processes = inject(ProcessesService);

  readonly count = signal(0);

  /** Bumped when the user clicks the bell — DashboardComponent reacts and reloads the list. */
  readonly viewRequested = signal(0);

  private backupTimer?: ReturnType<typeof setInterval>;
  private started = false;

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.refresh();
      this.startBackupTimer();
    } else {
      this.stopBackupTimer();
    }
  };

  /** Call once when the authenticated shell mounts. */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.refresh();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (document.visibilityState === 'visible') {
      this.startBackupTimer();
    }
  }

  /** Call when the authenticated shell is torn down (e.g. logout). */
  stop(): void {
    this.started = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stopBackupTimer();
  }

  refresh(): void {
    this.processes.listNovelties(1, 1).subscribe({
      next: (res) => this.count.set(res.total),
      error: () => {},
    });
  }

  /** Bell was clicked — ask whoever owns the Novedades list to switch tab and reload. */
  requestNoveltiesView(): void {
    this.viewRequested.update((n) => n + 1);
  }

  private startBackupTimer(): void {
    if (this.backupTimer) return;
    this.backupTimer = setInterval(() => this.refresh(), BACKUP_REFRESH_MS);
  }

  private stopBackupTimer(): void {
    clearInterval(this.backupTimer);
    this.backupTimer = undefined;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
