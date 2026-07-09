import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  LucideAngularModule,
  X,
} from 'lucide-angular';
import { ImportProgressService } from '../../../core/import-progress/import-progress.service';

@Component({
  selector: 'app-import-complete-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './import-complete-dialog.component.html',
  styleUrl: './import-complete-dialog.component.css',
})
export class ImportCompleteDialogComponent {
  readonly viewProcesses = output<void>();
  readonly dismissed = output<void>();

  protected readonly importProgress = inject(ImportProgressService);

  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Download = Download;
  protected readonly X = X;

  /** Errors already come inline on the job (GET /imports/active) — no separate CSV endpoint exists. */
  protected downloadErrors(): void {
    const job = this.importProgress.completedJob();
    if (!job || job.errors.length === 0) return;
    const header = 'Fila,Radicado,Codigo,Error';
    const rows = job.errors.map(
      (e) =>
        `${e.row},"${(e.radicado ?? '').replace(/"/g, '""')}","${(e.code ?? '').replace(/"/g, '""')}","${e.message.replace(/"/g, '""')}"`,
    );
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores-importacion-${job.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected close(): void {
    this.importProgress.dismiss();
    this.dismissed.emit();
  }

  protected goToProcesses(): void {
    this.importProgress.dismiss();
    this.viewProcesses.emit();
  }
}
