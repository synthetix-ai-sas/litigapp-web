import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Bell, CheckCircle, Clock, Eye, Info, LucideAngularModule } from 'lucide-angular';
import { ProcessListItem } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-novelties-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './novelties-tab.component.html',
  styleUrl: './novelties-tab.component.css',
})
export default class NoveltiesTabComponent {
  novelties = input<ProcessListItem[]>([]);
  loading = input<boolean>(false);
  attend = output<ProcessListItem>();

  protected readonly Bell = Bell;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Clock = Clock;
  protected readonly Eye = Eye;
  protected readonly Info = Info;

  protected formatDate = formatDate;
}
