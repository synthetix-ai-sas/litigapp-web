import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Bell, CheckCircle, Clock, Lock, LucideAngularModule, TriangleAlert, User, X } from 'lucide-angular';
import { ProcessDetail } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-attend-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './attend-modal.component.html',
  styleUrl: './attend-modal.component.css',
})
export class AttendModalComponent {
  process = input<ProcessDetail | null>(null);
  loading = input<boolean>(false);
  actionPending = input<boolean>(false);

  close = output<void>();
  markAttended = output<void>();

  protected readonly Bell = Bell;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Clock = Clock;
  protected readonly Lock = Lock;
  protected readonly TriangleAlert = TriangleAlert;
  protected readonly User = User;
  protected readonly X = X;

  protected formatDate = formatDate;
}
