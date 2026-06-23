import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Bell,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  LucideAngularModule,
  Plus,
  Scale,
  Search,
  TriangleAlert,
  Upload,
  User,
  X,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ImportsService } from '../../data-access/imports.service';
import { ProcessesService } from '../../data-access/processes.service';
import { ImportActiveResponse } from '../../shared/domain/import';
import { ProcessDetail, ProcessListItem } from '../../shared/domain/process';
import { MainLayoutComponent } from '../../shared/ui/layouts/main-layout/main-layout.component';
import { ProcessImport } from './process-import/process-import';
import { Wizard } from './wizard/wizard';

type Tab = 'novedades' | 'procesos';
type ModalType = 'atender' | 'opciones' | 'agregar' | null;
type AddTab = 'full-number' | 'wizard' | 'excel';
const PAGE_SIZE = 20;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule, Wizard, ProcessImport, MainLayoutComponent],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly processes = inject(ProcessesService);
  private readonly importsService = inject(ImportsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

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
  protected readonly addTab = signal<AddTab>('full-number');
  protected readonly selected = signal<ProcessDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly actionPending = signal(false);

  // agregar (full-number)
  protected readonly addForm = this.fb.nonNullable.group({
    fileNumber: ['', [Validators.required, Validators.pattern(/^\d{23}$/)]],
    alias: '',
  });
  protected readonly addError = signal<string | null>(null);

  // import active state (bloqueo UI)
  protected readonly importActive = signal<ImportActiveResponse | null>(null);
  private importActiveTimer?: ReturnType<typeof setInterval>;

  // partial sync polling (detail dialog)
  private syncPollingTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadNovelties();
    this.loadProcesos();
    this.startImportActivePolling();

    // debounce 300ms en filtros de procesos
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadProcesos(1));
  }

  ngOnDestroy(): void {
    clearInterval(this.importActiveTimer);
    clearInterval(this.syncPollingTimer);
  }

  private startImportActivePolling(): void {
    const poll = () =>
      this.importsService.getActive().subscribe({
        next: (res) => {
          this.importActive.set(res);
          if (res.hasActive && res.importJob?.status === 'completed') {
            this.importActive.set({ hasActive: false, importJob: null });
            this.loadProcesos(1);
            this.loadNovelties();
          }
        },
        error: () => {},
      });
    poll();
    this.importActiveTimer = setInterval(poll, 3000);
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
      .list({
        page,
        pageSize: PAGE_SIZE,
        courtName: f.courtName,
        fileNumber: f.fileNumber,
        subjectName: f.subjectName,
      })
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
        if (detail.syncStatus !== 'ok') {
          this.startSyncPolling(id);
        }
      },
      error: () => {
        this.detailLoading.set(false);
        this.closeModal();
      },
    });
  }

  private startSyncPolling(processId: string): void {
    clearInterval(this.syncPollingTimer);
    this.syncPollingTimer = setInterval(() => {
      this.processes.getById(processId).subscribe({
        next: (detail) => {
          this.selected.set(detail);
          if (detail.syncStatus === 'ok') {
            clearInterval(this.syncPollingTimer);
          }
        },
        error: () => {},
      });
    }, 10000);
  }

  protected openAgregar(): void {
    if (this.importActive()?.hasActive) return;
    this.addForm.reset({ fileNumber: '', alias: '' });
    this.addError.set(null);
    this.addTab.set('full-number');
    this.modalType.set('agregar');
  }

  protected closeModal(): void {
    this.modalType.set(null);
    this.selected.set(null);
    this.actionPending.set(false);
    clearInterval(this.syncPollingTimer);
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
      error: (err: { status?: number }) => {
        this.actionPending.set(false);
        this.addError.set(this.addErrorMessage(err?.status));
      },
    });
  }

  protected onWizardCreated(): void {
    this.closeModal();
    this.activeTab.set('procesos');
    this.loadProcesos(1);
    this.loadNovelties();
  }

  protected onImportCompleted(): void {
    this.closeModal();
    this.activeTab.set('procesos');
    this.loadProcesos(1);
    this.loadNovelties();
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
