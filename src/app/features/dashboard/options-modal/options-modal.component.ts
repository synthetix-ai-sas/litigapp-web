import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Clock, Download, FileText, History, Lock, LucideAngularModule, TriangleAlert, User, X } from 'lucide-angular';
import { ProcessDetail } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-options-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './options-modal.component.html',
  styleUrl: './options-modal.component.css',
})
export class OptionsModalComponent {
  process = input<ProcessDetail | null>(null);
  loading = input<boolean>(false);

  close = output<void>();
  downloadPdf = output<void>();

  protected readonly Clock = Clock;
  protected readonly Download = Download;
  protected readonly FileText = FileText;
  protected readonly History = History;
  protected readonly Lock = Lock;
  protected readonly TriangleAlert = TriangleAlert;
  protected readonly User = User;
  protected readonly X = X;

  protected formatDate = formatDate;
}
