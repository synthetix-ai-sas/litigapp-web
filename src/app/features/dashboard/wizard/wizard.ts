import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Building, LucideAngularModule, TriangleAlert } from 'lucide-angular';

import { CatalogService } from '../../../data-access/catalog.service';
import { ProcessesService } from '../../../data-access/processes.service';
import { City, CourtItem, Department, Specialty } from '../../../shared/domain/catalog';

@Component({
  selector: 'app-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './wizard.html',
})
export class Wizard implements OnInit {
  @Output() created = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly Building = Building;
  protected readonly TriangleAlert = TriangleAlert;

  private readonly catalog = inject(CatalogService);
  private readonly processes = inject(ProcessesService);

  protected readonly departments = signal<Department[]>([]);
  protected readonly cities = signal<City[]>([]);
  protected readonly courts = signal<CourtItem[]>([]);
  protected readonly specialties = signal<Specialty[]>([]);

  protected readonly deptLoading = signal(false);
  protected readonly cityLoading = signal(false);
  protected readonly courtLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly selectedDeptId = signal('');
  protected readonly selectedCityId = signal('');
  protected readonly selectedCourtId = signal('');
  protected readonly selectedSpecialtyId = signal('');
  protected readonly lastDigits = signal('');

  protected readonly builtRadicado = computed(() => {
    const digits = this.lastDigits().replace(/\D/g, '');
    const filled = digits.padEnd(10, '-');
    const prefix = '—————————————';
    return prefix + filled;
  });

  protected readonly canSubmit = computed(
    () =>
      !!this.selectedDeptId() &&
      !!this.selectedCityId() &&
      !!this.selectedCourtId() &&
      this.lastDigits().replace(/\D/g, '').length >= 4,
  );

  ngOnInit(): void {
    this.deptLoading.set(true);
    this.catalog.listDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.deptLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los departamentos.');
        this.deptLoading.set(false);
      },
    });
  }

  protected onDeptChange(deptId: string): void {
    this.selectedDeptId.set(deptId);
    this.selectedCityId.set('');
    this.selectedCourtId.set('');
    this.selectedSpecialtyId.set('');
    this.cities.set([]);
    this.courts.set([]);
    this.specialties.set([]);
    if (!deptId) return;
    this.cityLoading.set(true);
    this.catalog.listCities(deptId).subscribe({
      next: (cities) => {
        this.cities.set(cities);
        this.cityLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las ciudades.');
        this.cityLoading.set(false);
      },
    });
  }

  protected onCityChange(cityId: string): void {
    this.selectedCityId.set(cityId);
    this.selectedCourtId.set('');
    this.selectedSpecialtyId.set('');
    this.courts.set([]);
    this.specialties.set([]);
    if (!cityId) return;
    this.courtLoading.set(true);
    this.catalog.listCourts(cityId).subscribe({
      next: (courts) => {
        this.courts.set(courts);
        this.courtLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los despachos.');
        this.courtLoading.set(false);
      },
    });
    this.catalog.listSpecialties().subscribe({
      next: (specs) => this.specialties.set(specs),
      error: () => {},
    });
  }

  protected onSpecialtyChange(specialtyId: string): void {
    this.selectedSpecialtyId.set(specialtyId);
    this.selectedCourtId.set('');
    this.courts.set([]);
    if (!this.selectedCityId()) return;
    this.courtLoading.set(true);
    this.catalog.listCourts(this.selectedCityId(), specialtyId || undefined).subscribe({
      next: (courts) => {
        this.courts.set(courts);
        this.courtLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los despachos.');
        this.courtLoading.set(false);
      },
    });
  }

  protected submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    const digits = this.lastDigits().replace(/\D/g, '');
    const filingYear = parseInt(digits.slice(0, 4), 10);
    const consecutive = digits.slice(4);
    this.submitting.set(true);
    this.error.set(null);
    this.processes
      .createFromWizard({
        cityId: this.selectedCityId(),
        courtId: this.selectedCourtId(),
        filingYear,
        consecutive,
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
