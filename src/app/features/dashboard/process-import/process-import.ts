import {
  ChangeDetectionStrategy,
  Component,
  OutputEmitterRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FileSpreadsheet, LucideAngularModule, TriangleAlert, Upload } from 'lucide-angular';

import { ImportProgressService } from '../../../core/import-progress/import-progress.service';
import { ImportsService } from '../../../data-access/imports.service';
import { ImportColumn, ImportPreview } from '../../../shared/domain/import';

type ImportStep = 'upload' | 'mapping';

@Component({
  selector: 'app-process-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './process-import.html',
})
export class ProcessImport {
  readonly completed: OutputEmitterRef<void> = output<void>();
  readonly cancelled: OutputEmitterRef<void> = output<void>();

  protected readonly Upload = Upload;
  protected readonly FileSpreadsheet = FileSpreadsheet;
  protected readonly TriangleAlert = TriangleAlert;

  private readonly imports = inject(ImportsService);
  private readonly importProgress = inject(ImportProgressService);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal<ImportStep>('upload');
  protected readonly preview = signal<ImportPreview | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dragOver = signal(false);

  /** v1: radicado (required) + notas (optional) — matches backend ColumnMappingRequest. */
  protected readonly mappingForm = this.fb.nonNullable.group({
    radicadoCol: ['', Validators.required],
    notesCol: '',
  });

  protected headerList(columns: ImportColumn[]): string {
    return columns.map((c) => c.header ?? '(sin nombre)').join(', ');
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
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      this.error.set('Solo se aceptan archivos .xlsx o .xls');
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
      next: (prev) => {
        this.preview.set(prev);
        this.uploading.set(false);
        this.step.set('mapping');
        this.mappingForm.reset({ radicadoCol: '', notesCol: '' });
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
    const prev = this.preview();
    if (!prev) return;

    this.submitting.set(true);
    this.error.set(null);
    const { radicadoCol, notesCol } = this.mappingForm.getRawValue();
    const file = this.selectedFile();

    this.imports
      .execute(
        prev.previewId,
        { radicadoCol, notesCol: notesCol || null },
        file?.name,
      )
      .subscribe({
        next: () => {
          this.submitting.set(false);
          // Delegate all polling and state to the singleton service.
          this.importProgress.startTracking();
          this.completed.emit();
        },
        error: () => {
          this.submitting.set(false);
          this.error.set('No se pudo iniciar la importación. Por favor intenta de nuevo.');
        },
      });
  }
}
