import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CheckCircle,
  FileSpreadsheet,
  LucideAngularModule,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-angular';

import { ImportsService } from '../../../data-access/imports.service';
import { FileNumberMode, ImportJob, ImportPreview } from '../../../shared/domain/import';

type ImportStep = 'upload' | 'mapping' | 'progress';

@Component({
  selector: 'app-process-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './process-import.html',
})
export class ProcessImport implements OnDestroy {
  @Output() completed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly Upload = Upload;
  protected readonly FileSpreadsheet = FileSpreadsheet;
  protected readonly CheckCircle = CheckCircle;
  protected readonly TriangleAlert = TriangleAlert;
  protected readonly X = X;

  private readonly imports = inject(ImportsService);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal<ImportStep>('upload');
  protected readonly preview = signal<ImportPreview | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly fileNumberMode = signal<FileNumberMode>('full');
  protected readonly importJob = signal<ImportJob | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly dragOver = signal(false);

  protected readonly mappingForm = this.fb.nonNullable.group({
    fileNumberColumn: ['', Validators.required],
    filingYearColumn: '',
    cityColumn: '',
    courtColumn: '',
    consecutiveColumn: '',
    demandantColumn: '',
    demandadoColumn: '',
    aliasColumn: '',
  });

  private pollingTimer?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    clearInterval(this.pollingTimer);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void {
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  protected onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      this.error.set('Solo se aceptan archivos .xlsx, .xls o .csv');
      return;
    }
    this.error.set(null);
    this.selectedFile.set(file);
  }

  protected upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;
    this.uploading.set(true);
    this.error.set(null);
    this.imports.preview(file).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.uploading.set(false);
        this.step.set('mapping');
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('No se pudo procesar el archivo. Asegúrate de que sea un Excel válido.');
      },
    });
  }

  protected submitMapping(): void {
    if (this.mappingForm.invalid || this.submitting()) {
      this.mappingForm.markAllAsTouched();
      return;
    }
    const p = this.preview();
    if (!p) return;
    this.submitting.set(true);
    this.error.set(null);
    const raw = this.mappingForm.getRawValue();
    this.imports
      .execute(
        p.previewId,
        {
          fileNumberColumn: raw.fileNumberColumn || null,
          filingYearColumn: raw.filingYearColumn || null,
          cityColumn: raw.cityColumn || null,
          courtColumn: raw.courtColumn || null,
          consecutiveColumn: raw.consecutiveColumn || null,
          demandantColumn: raw.demandantColumn || null,
          demandadoColumn: raw.demandadoColumn || null,
          aliasColumn: raw.aliasColumn || null,
        },
        this.fileNumberMode(),
      )
      .subscribe({
        next: ({ importJobId }) => {
          this.submitting.set(false);
          this.step.set('progress');
          this.startPolling(importJobId);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set('No se pudo iniciar la importación. Por favor intenta de nuevo.');
        },
      });
  }

  private startPolling(jobId: string): void {
    this.pollingTimer = setInterval(() => {
      this.imports.getById(jobId).subscribe({
        next: (job) => {
          this.importJob.set(job);
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(this.pollingTimer);
            if (job.status === 'completed') {
              setTimeout(() => this.completed.emit(), 1500);
            }
          }
        },
        error: () => {},
      });
    }, 3000);
  }

  protected get progressPct(): number {
    const job = this.importJob();
    if (!job || job.totalRows === 0) return 0;
    return Math.round((job.processedRows / job.totalRows) * 100);
  }

  protected columnLabel(col: string): string {
    return `Column ${col}`;
  }
}
