import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import {
  AlertTriangle,
  CheckCircle,
  Download,
  LucideAngularModule,
  X,
} from 'lucide-angular';
import { ImportProgressService } from '../../../core/import-progress/import-progress.service';
import { ImportsService } from '../../../data-access/imports.service';

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
  private readonly importsService = inject(ImportsService);

  protected readonly CheckCircle = CheckCircle;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Download = Download;
  protected readonly X = X;

  protected downloadErrors(): void {
    const job = this.importProgress.completedJob();
    if (!job) return;
    this.importsService.downloadErrorsCsv(job.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errores-importacion-${job.id.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
