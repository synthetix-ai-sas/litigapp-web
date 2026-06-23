import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, X } from 'lucide-angular';
import { ProcessImport } from '../process-import/process-import';
import { Wizard } from '../wizard/wizard';

type AddTab = 'full-number' | 'wizard' | 'excel';

@Component({
  selector: 'app-agregar-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ReactiveFormsModule, Wizard, ProcessImport],
  templateUrl: './agregar-modal.component.html',
  styleUrl: './agregar-modal.component.css',
})
export class AgregarModalComponent {
  addForm = input.required<FormGroup>();
  addError = input<string | null>(null);
  actionPending = input<boolean>(false);

  close = output<void>();
  submitted = output<void>();
  wizardCreated = output<void>();
  importCompleted = output<void>();

  protected readonly addTab = signal<AddTab>('full-number');
  protected readonly tabs: { id: AddTab; label: string }[] = [
    { id: 'full-number', label: 'Número completo' },
    { id: 'wizard', label: 'Asistente' },
    { id: 'excel', label: 'Excel' },
  ];

  protected readonly Plus = Plus;
  protected readonly X = X;
}
