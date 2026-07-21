import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  LoaderCircle,
  LucideAngularModule,
  X,
} from 'lucide-angular';
import { ImportProgressService } from '../../../core/import-progress/import-progress.service';
import { ImportsService } from '../../../data-access/imports.service';

const ERRORS_CSV_FILENAME = 'procesos_con_errores.csv';

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
  private readonly imports = inject(ImportsService);

  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Download = Download;
  protected readonly LoaderCircle = LoaderCircle;
  protected readonly X = X;

  protected readonly downloadingErrors = signal(false);
  protected readonly downloadError = signal<string | null>(null);

  /** Streams the CSV straight from the backend — same builder as the email attachment. */
  protected downloadErrors(): void {
    const job = this.importProgress.completedJob();
    if (!job || this.downloadingErrors()) return;

    this.downloadingErrors.set(true);
    this.downloadError.set(null);

    this.imports.downloadErrorsCsv(job.id).subscribe({
      next: (blob) => {
        this.downloadingErrors.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ERRORS_CSV_FILENAME;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingErrors.set(false);
        this.downloadError.set('No se pudo descargar el archivo. Intenta de nuevo.');
      },
    });
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
