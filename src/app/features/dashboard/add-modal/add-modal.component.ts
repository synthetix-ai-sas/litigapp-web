import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileSpreadsheet, LucideAngularModule, Plus, User, X } from 'lucide-angular';
import { ProcessImport } from '../process-import/process-import';
import { Wizard } from '../wizard/wizard';

type Mode = 'individual' | 'masiva';
type SubMode = 'full-number' | 'wizard' | null;

@Component({
  selector: 'app-add-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ReactiveFormsModule, Wizard, ProcessImport],
  templateUrl: './add-modal.component.html',
  styleUrl: './add-modal.component.css',
})
export class AddModalComponent {
  addForm = input.required<FormGroup>();
  addError = input<string | null>(null);
  actionPending = input<boolean>(false);

  close = output<void>();
  submitted = output<void>();
  wizardCreated = output<void>();
  importCompleted = output<void>();

  protected readonly mode = signal<Mode>('individual');
  protected readonly subMode = signal<SubMode>(null);

  protected readonly Plus = Plus;
  protected readonly X = X;
  protected readonly User = User;
  protected readonly FileSpreadsheet = FileSpreadsheet;

  protected setMode(m: Mode): void {
    this.mode.set(m);
    this.subMode.set(null);
  }
}
