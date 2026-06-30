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
import { Bell, FileText, LucideAngularModule, Plus } from 'lucide-angular';
import { debounceTime } from 'rxjs';

import { ImportsService } from '../../data-access/imports.service';
import { ProcessesService } from '../../data-access/processes.service';
import { ImportActiveResponse } from '../../shared/domain/import';
import { ProcessDetail, ProcessListItem } from '../../shared/domain/process';
import { AddModalComponent } from './add-modal/add-modal.component';
import { AttendModalComponent } from './attend-modal/attend-modal.component';
import { ImportBannerComponent } from './import-banner/import-banner.component';
import NoveltiesTabComponent from './novelties-tab/novelties-tab.component';
import { OptionsModalComponent } from './options-modal/options-modal.component';
import ProcessesTabComponent from './processes-tab/processes-tab.component';

type Tab = 'novelties' | 'cases';
type ModalType = 'attend' | 'options' | 'add' | null;
type AddTab = 'full-number' | 'wizard' | 'excel';
const PAGE_SIZE = 20;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    ImportBannerComponent,
    NoveltiesTabComponent,
    ProcessesTabComponent,
    AttendModalComponent,
    OptionsModalComponent,
    AddModalComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly processes = inject(ProcessesService);
  private readonly importsService = inject(ImportsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // icons
  protected readonly Bell = Bell;
  protected readonly FileText = FileText;
  protected readonly Plus = Plus;

  protected readonly activeTab = signal<Tab>('novelties');

  // novelties
  protected readonly novelties = signal<ProcessListItem[]>([]);
  protected readonly noveltiesTotal = signal(0);
  protected readonly noveltiesLoading = signal(false);

  // cases
  protected readonly cases = signal<ProcessListItem[]>([]);
  protected readonly casesTotal = signal(0);
  protected readonly casesPage = signal(1);
  protected readonly casesLoading = signal(false);
  protected readonly casesTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.casesTotal() / PAGE_SIZE)),
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

  // add (full-number)
  protected readonly addForm = this.fb.nonNullable.group({
    fileNumber: ['', [Validators.required, Validators.pattern(/^\d{23}$/)]],
    alias: '',
  });
  protected readonly addError = signal<string | null>(null);

  // import active state (blocks UI)
  protected readonly importActive = signal<ImportActiveResponse | null>(null);
  private importActiveTimer?: ReturnType<typeof setInterval>;

  // partial sync polling (detail dialog)
  private syncPollingTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadNovelties();
    this.loadCases();
    this.startImportActivePolling();

    // 300ms debounce on case filters
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadCases(1));
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
            this.loadCases(1);
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

  protected loadCases(page = this.casesPage()): void {
    this.casesLoading.set(true);
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
          this.cases.set(res.items);
          this.casesTotal.set(res.total);
          this.casesPage.set(res.page);
          this.casesLoading.set(false);
        },
        error: () => this.casesLoading.set(false),
      });
  }

  protected applyFilters(): void {
    this.loadCases(1);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.casesTotalPages()) return;
    this.loadCases(page);
  }

  protected openAttend(item: ProcessListItem): void {
    this.openDetail(item.id, 'attend');
  }

  protected openOptions(item: ProcessListItem): void {
    this.openDetail(item.id, 'options');
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

  protected openAdd(): void {
    if (this.importActive()?.hasActive) return;
    this.addForm.reset({ fileNumber: '', alias: '' });
    this.addError.set(null);
    this.addTab.set('full-number');
    this.modalType.set('add');
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

    // optimistic: drop from novelties immediately
    this.novelties.update((items) => items.filter((p) => p.id !== detail.id));
    this.noveltiesTotal.update((n) => Math.max(0, n - 1));

    this.processes.markAttended(detail.id).subscribe({
      next: () => {
        this.loadCases();
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
      a.download = `case-${detail.fileNumber}.pdf`;
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
        this.activeTab.set('cases');
        this.loadCases(1);
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
    this.activeTab.set('cases');
    this.loadCases(1);
    this.loadNovelties();
  }

  protected onImportCompleted(): void {
    this.closeModal();
    this.activeTab.set('cases');
    this.loadCases(1);
    this.loadNovelties();
  }

  private addErrorMessage(status?: number): string {
    switch (status) {
      case 409:
        return 'The case already exists or an import is currently in progress.';
      case 422:
        return 'Case not found in the Judicial Branch.';
      case 400:
        return 'Invalid file number (must be 23 digits).';
      default:
        return 'Could not create the case. Please try again.';
    }
  }
}
