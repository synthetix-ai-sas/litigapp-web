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
  private readonly onVisible = (): void => {
    // Browsers throttle setInterval heavily on backgrounded tabs (Chrome: as
    // little as once/minute). Firing a tick the moment the tab regains focus
    // means the user sees the outcome immediately instead of waiting out a
    // throttled interval — on top of the /imports/{id} fallback in tick(),
    // which guarantees correctness even if this listener never fires.
    if (document.visibilityState === 'visible' && this.pollingTimer) {
      this.tick();
    }
  };

  /**
   * Id of the job we're tracking, kept until we've confirmed a terminal state.
   * GET /imports/active only reports a completed job for 60s after CompletedAt —
   * if a poll is delayed past that window (e.g. the browser throttles setInterval
   * on a backgrounded tab, which is the common real-world trigger), the job can
   * vanish from /active without the frontend ever having observed 'completed'.
   * When that happens we fall back to GET /imports/{id}, which has no time window,
   * to get the definitive final state instead of silently giving up.
   */
  private trackedJobId: string | null = null;

  /** Call this immediately after POST /imports succeeds, with the returned importJobId. */
  startTracking(jobId: string): void {
    this.stopPolling();
    this.activeImport.set(null);
    this.completedJob.set(null);
    this.consecutiveErrors = 0;
    this.trackedJobId = jobId;
    this.pollingTimer = setInterval(() => this.tick(), 3000);
    document.addEventListener('visibilitychange', this.onVisible);
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
          // Backend says nothing is active/recent. Before giving up, confirm
          // against the specific job we started — the 60s "recent" window on
          // /active may have lapsed between polls without us ever seeing the
          // completed status (see trackedJobId doc comment).
          this.resolveViaFallback();
          return;
        }

        if (job.status === 'completed' || job.status === 'failed') {
          this.stopPolling();
          this.activeImport.set(null);
          this.trackedJobId = null;
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
          this.trackedJobId = null;
        }
      },
    });
  }

  /** GET /imports/{id} has no time window — always returns the job's true current state. */
  private resolveViaFallback(): void {
    const jobId = this.trackedJobId;
    if (!jobId) {
      this.stopPolling();
      this.activeImport.set(null);
      return;
    }

    this.importsService.getById(jobId).subscribe({
      next: (job) => {
        this.stopPolling();
        this.activeImport.set(null);
        this.trackedJobId = null;
        if (job.status === 'completed') {
          this.completedJob.set(job);
        }
      },
      error: () => {
        // Job truly gone or unreachable — nothing more we can do.
        this.stopPolling();
        this.activeImport.set(null);
        this.trackedJobId = null;
      },
    });
  }

  private stopPolling(): void {
    clearInterval(this.pollingTimer);
    this.pollingTimer = undefined;
    document.removeEventListener('visibilitychange', this.onVisible);
  }
}
