import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { ImportsService } from '../../data-access/imports.service';
import { ImportJob } from '../../shared/domain/import';

/** Consecutive poll failures tolerated before giving up on a down backend. */
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Singleton that owns the import polling lifecycle.
 * Polling starts ONLY after startTracking() is called (i.e. user initiates an import).
 * It auto-stops when status reaches 'completed' or 'failed', or after several
 * consecutive network errors (a single transient blip must not kill the loop —
 * the bulk import job itself competes for DB connections with this poll).
 * Dashboard and banner read signals; they never call the backend directly for import state.
 */
@Injectable({ providedIn: 'root' })
export class ImportProgressService implements OnDestroy {
  private readonly importsService = inject(ImportsService);

  /** Non-null while an import is pending/running/paused. Cleared when done or dismissed. */
  readonly activeImport = signal<ImportJob | null>(null);

  /** Set when polling detects 'completed'. Dashboard reads this to show the summary popup. */
  readonly completedJob = signal<ImportJob | null>(null);

  private pollingTimer?: ReturnType<typeof setInterval>;
  private consecutiveErrors = 0;

  /** Call this immediately after POST /imports succeeds. */
  startTracking(): void {
    this.stopPolling();
    this.activeImport.set(null);
    this.completedJob.set(null);
    this.consecutiveErrors = 0;
    this.pollingTimer = setInterval(() => this.tick(), 3000);
    // Run one tick immediately so the banner appears without a 3s delay.
    this.tick();
  }

  /** Call after the user dismisses the completion popup. */
  dismiss(): void {
    this.completedJob.set(null);
    this.activeImport.set(null);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private tick(): void {
    this.importsService.getActive().subscribe({
      next: (job) => {
        this.consecutiveErrors = 0;

        if (job === null) {
          // No active import — backend already past the 60s completed window
          // (204 No Content, mapped to null by ImportsService).
          this.stopPolling();
          this.activeImport.set(null);
          return;
        }

        if (job.status === 'completed' || job.status === 'failed') {
          this.stopPolling();
          this.activeImport.set(null);
          if (job.status === 'completed') {
            this.completedJob.set(job);
          }
        } else {
          this.activeImport.set(job);
        }
      },
      error: () => {
        // Tolerate transient failures (e.g. the bulk import job itself straining
        // the DB pool) — only give up after several polls in a row fail.
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          this.stopPolling();
          this.activeImport.set(null);
        }
      },
    });
  }

  private stopPolling(): void {
    clearInterval(this.pollingTimer);
    this.pollingTimer = undefined;
  }
}
