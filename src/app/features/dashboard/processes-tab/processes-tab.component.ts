import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  Bell,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  LucideAngularModule,
  Plus,
  Search,
  Upload,
  User,
} from 'lucide-angular';
import { ImportActiveResponse } from '../../../shared/domain/import';
import { ProcessListItem } from '../../../shared/domain/process';
import { formatDate } from '../../../shared/util/format-date';

@Component({
  selector: 'app-processes-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LucideAngularModule, ReactiveFormsModule],
  templateUrl: './processes-tab.component.html',
  styleUrl: './processes-tab.component.css',
})
export default class ProcessesTabComponent {
  procesos = input<ProcessListItem[]>([]);
  procesosLoading = input<boolean>(false);
  procesosTotal = input<number>(0);
  procesosPage = input<number>(1);
  procesosTotalPages = input<number>(1);
  filterForm = input.required<FormGroup>();
  importActive = input<ImportActiveResponse | null>(null);

  openOpciones = output<ProcessListItem>();
  openAgregar = output<void>();
  goToPage = output<number>();
  applyFilters = output<void>();

  protected readonly Bell = Bell;
  protected readonly Building = Building;
  protected readonly CheckCircle = CheckCircle;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Clock = Clock;
  protected readonly FileText = FileText;
  protected readonly Plus = Plus;
  protected readonly Search = Search;
  protected readonly Upload = Upload;
  protected readonly User = User;

  protected formatDate = formatDate;
}
