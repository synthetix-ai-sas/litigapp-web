import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Building,
  ChevronLeft,
  ChevronRight,
  Hash,
  LucideAngularModule,
  MapPin,
  Scale,
  TriangleAlert,
} from 'lucide-angular';

import { CatalogService } from '../../../data-access/catalog.service';
import { ProcessesService } from '../../../data-access/processes.service';
import { City, CourtItem, Department, Specialty } from '../../../shared/domain/catalog';

type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './wizard.html',
})
export class Wizard implements OnInit {
  @Output() created = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;
  protected readonly Building = Building;
  protected readonly MapPin = MapPin;
  protected readonly Scale = Scale;
  protected readonly Hash = Hash;
  protected readonly TriangleAlert = TriangleAlert;

  private readonly catalog = inject(CatalogService);
  private readonly processes = inject(ProcessesService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly step = signal<WizardStep>(1);
  protected readonly departments = signal<Department[]>([]);
  protected readonly cities = signal<City[]>([]);
  protected readonly courts = signal<CourtItem[]>([]);
  protected readonly specialties = signal<Specialty[]>([]);
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly selectedDeptId = signal('');
  protected readonly selectedCityId = signal('');
  protected readonly selectedCourtId = signal('');
  protected readonly selectedSpecialtyId = signal('');

  protected readonly step4Form = this.fb.nonNullable.group({
    filingYear: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1990), Validators.max(new Date().getFullYear())],
    ],
    consecutive: ['', [Validators.required, Validators.pattern(/^\d{1,11}$/)]],
    alias: '',
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.catalog.listDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los departamentos. Por favor intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected goToStep2(): void {
    if (!this.selectedDeptId()) return;
    this.step.set(2);
    this.cities.set([]);
    this.selectedCityId.set('');
    this.loading.set(true);
    this.catalog.listCities(this.selectedDeptId()).subscribe({
      next: (cities) => {
        this.cities.set(cities);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las ciudades.');
        this.loading.set(false);
      },
    });
  }

  protected goToStep3(): void {
    if (!this.selectedCityId()) return;
    this.step.set(3);
    this.courts.set([]);
    this.selectedCourtId.set('');
    this.loading.set(true);
    this.catalog.listCourts(this.selectedCityId()).subscribe({
      next: (courts) => {
        this.courts.set(courts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los despachos.');
        this.loading.set(false);
      },
    });
    this.catalog.listSpecialties().subscribe({
      next: (specs) => this.specialties.set(specs),
      error: () => {},
    });
  }

  protected filterCourts(): void {
    if (!this.selectedCityId()) return;
    this.courts.set([]);
    this.selectedCourtId.set('');
    this.loading.set(true);
    this.catalog
      .listCourts(this.selectedCityId(), this.selectedSpecialtyId() || undefined)
      .subscribe({
        next: (courts) => {
          this.courts.set(courts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Error al cargar los despachos.');
          this.loading.set(false);
        },
      });
  }

  protected goToStep4(): void {
    if (!this.selectedCourtId()) return;
    this.step.set(4);
  }

  protected back(): void {
    const s = this.step();
    if (s > 1) {
      this.step.set((s - 1) as WizardStep);
    } else {
      this.cancelled.emit();
    }
  }

  protected submit(): void {
    if (this.step4Form.invalid || this.submitting()) {
      this.step4Form.markAllAsTouched();
      return;
    }
    const { filingYear, consecutive, alias } = this.step4Form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.processes
      .createFromWizard({
        cityId: this.selectedCityId(),
        courtId: this.selectedCourtId(),
        filingYear,
        consecutive,
        alias: alias || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.created.emit();
        },
        error: (err: { status?: number }) => {
          this.submitting.set(false);
          this.error.set(this.errorMessage(err?.status));
        },
      });
  }

  private errorMessage(status?: number): string {
    switch (status) {
      case 409:
        return 'El proceso ya existe en tu portafolio.';
      case 422:
        return 'El proceso no fue encontrado en la Rama Judicial.';
      case 400:
        return 'Datos inválidos. Verifica el consecutivo.';
      default:
        return 'No se pudo crear el proceso. Por favor intenta de nuevo.';
    }
  }
}
