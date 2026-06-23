import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Bell, CheckCircle, Clock, LucideAngularModule, TriangleAlert, User, X } from 'lucide-angular';
import { ProcessDetail } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-atender-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './atender-modal.component.html',
  styleUrl: './atender-modal.component.css',
})
export class AtenderModalComponent {
  process = input<ProcessDetail | null>(null);
  loading = input<boolean>(false);
  actionPending = input<boolean>(false);

  close = output<void>();
  markAttended = output<void>();

  protected readonly Bell = Bell;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Clock = Clock;
  protected readonly TriangleAlert = TriangleAlert;
  protected readonly User = User;
  protected readonly X = X;

  protected formatDate = formatDate;
}
