import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Download, LucideAngularModule, Scale, TriangleAlert, X } from 'lucide-angular';
import { ProcessDetail } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-opciones-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './opciones-modal.component.html',
  styleUrl: './opciones-modal.component.css',
})
export class OpcionesModalComponent {
  process = input<ProcessDetail | null>(null);
  loading = input<boolean>(false);

  close = output<void>();
  downloadPdf = output<void>();

  protected readonly Download = Download;
  protected readonly Scale = Scale;
  protected readonly TriangleAlert = TriangleAlert;
  protected readonly X = X;

  protected formatDate = formatDate;
}
