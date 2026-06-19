import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Scale,
  Bell,
  FileText,
  Search,
  Eye,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building,
  User,
  Download,
  Plus,
  Upload,
  FileSpreadsheet,
  LogOut,
  TriangleAlert,
} from 'lucide-angular';

import { AuthService } from '../../core/auth/auth.service';
import { ProcessesService } from '../../data-access/processes.service';
import { ProcessDetail, ProcessListItem } from '../../shared/domain/process';

type Tab = 'novedades' | 'procesos';
type ModalType = 'atender' | 'opciones' | 'agregar' | null;
const PAGE_SIZE = 20;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly processes = inject(ProcessesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // icons
  protected readonly Scale = Scale;
  protected readonly Bell = Bell;
  protected readonly FileText = FileText;
  protected readonly Search = Search;
  protected readonly Eye = Eye;
  protected readonly CheckCircle = CheckCircle;
  protected readonly X = X;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Clock = Clock;
  protected readonly Building = Building;
  protected readonly User = User;
  protected readonly Download = Download;
  protected readonly Plus = Plus;
  protected readonly Upload = Upload;
  protected readonly FileSpreadsheet = FileSpreadsheet;
  protected readonly LogOut = LogOut;
  protected readonly TriangleAlert = TriangleAlert;

  protected readonly activeTab = signal<Tab>('novedades');

  // novedades
  protected readonly novelties = signal<ProcessListItem[]>([]);
  protected readonly noveltiesTotal = signal(0);
  protected readonly noveltiesLoading = signal(false);

  // procesos
  protected readonly procesos = signal<ProcessListItem[]>([]);
  protected readonly procesosTotal = signal(0);
  protected readonly procesosPage = signal(1);
  protected readonly procesosLoading = signal(false);
  protected readonly procesosTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.procesosTotal() / PAGE_SIZE)),
  );

  protected readonly filterForm = this.fb.nonNullable.group({
    courtName: '',
    fileNumber: '',
    subjectName: '',
  });

  // modals
  protected readonly modalType = signal<ModalType>(null);
  protected readonly selected = signal<ProcessDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly actionPending = signal(false);

  // agregar (full-number)
  protected readonly addForm = this.fb.nonNullable.group({
    fileNumber: ['', [Validators.required, Validators.pattern(/^\d{23}$/)]],
    alias: '',
  });
  protected readonly addError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadNovelties();
    this.loadProcesos();
  }

  protected setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  protected loadNovelties(): void {
    this.noveltiesLoading.set(true);
    this.processes.listNovelties(1, PAGE_SIZE).subscribe({
      next: (res) => {
        this.novelties.set(res.items);
        this.noveltiesTotal.set(res.total);
        this.noveltiesLoading.set(false);
      },
      error: () => this.noveltiesLoading.set(false),
    });
  }

  protected loadProcesos(page = this.procesosPage()): void {
    this.procesosLoading.set(true);
    const f = this.filterForm.getRawValue();
    this.processes
      .list({ page, pageSize: PAGE_SIZE, courtName: f.courtName, fileNumber: f.fileNumber, subjectName: f.subjectName })
      .subscribe({
        next: (res) => {
          this.procesos.set(res.items);
          this.procesosTotal.set(res.total);
          this.procesosPage.set(res.page);
          this.procesosLoading.set(false);
        },
        error: () => this.procesosLoading.set(false),
      });
  }

  protected applyFilters(): void {
    this.loadProcesos(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.procesosTotalPages()) return;
    this.loadProcesos(page);
  }

  protected openAtender(item: ProcessListItem): void {
    this.openDetail(item.id, 'atender');
  }

  protected openOpciones(item: ProcessListItem): void {
    this.openDetail(item.id, 'opciones');
  }

  private openDetail(id: string, type: ModalType): void {
    this.modalType.set(type);
    this.selected.set(null);
    this.detailLoading.set(true);
    this.processes.getById(id).subscribe({
      next: (detail) => {
        this.selected.set(detail);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        this.closeModal();
      },
    });
  }

  protected openAgregar(): void {
    this.addForm.reset({ fileNumber: '', alias: '' });
    this.addError.set(null);
    this.modalType.set('agregar');
  }

  protected closeModal(): void {
    this.modalType.set(null);
    this.selected.set(null);
    this.actionPending.set(false);
  }

  protected markAttended(): void {
    const detail = this.selected();
    if (!detail || this.actionPending()) return;
    this.actionPending.set(true);

    // optimistic: drop from novedades immediately
    this.novelties.update((items) => items.filter((p) => p.id !== detail.id));
    this.noveltiesTotal.update((n) => Math.max(0, n - 1));

    this.processes.markAttended(detail.id).subscribe({
      next: () => {
        this.loadProcesos();
        this.closeModal();
      },
      error: () => {
        // rollback
        this.actionPending.set(false);
        this.loadNovelties();
      },
    });
  }

  protected downloadPdf(): void {
    const detail = this.selected();
    if (!detail || !detail.canDownloadPdf) return;
    this.processes.downloadPdf(detail.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proceso-${detail.fileNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      this.closeModal();
    });
  }

  protected submitAdd(): void {
    if (this.addForm.invalid || this.actionPending()) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.actionPending.set(true);
    this.addError.set(null);
    const { fileNumber, alias } = this.addForm.getRawValue();
    this.processes.createFromFileNumber(fileNumber, alias || undefined).subscribe({
      next: () => {
        this.actionPending.set(false);
        this.closeModal();
        this.activeTab.set('procesos');
        this.loadProcesos(1);
        this.loadNovelties();
      },
      error: (err) => {
        this.actionPending.set(false);
        this.addError.set(this.addErrorMessage(err?.status));
      },
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  protected formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private addErrorMessage(status?: number): string {
    switch (status) {
      case 409:
        return 'El proceso ya existe o hay una importación en curso.';
      case 422:
        return 'Proceso no encontrado en la Rama Judicial.';
      case 400:
        return 'Radicado inválido (deben ser 23 dígitos).';
      default:
        return 'No se pudo crear el proceso. Intenta de nuevo.';
    }
  }
}
