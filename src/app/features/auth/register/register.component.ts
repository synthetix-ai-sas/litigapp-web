import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('password')?.value as string | undefined;
  const confirm = group.get('confirmPassword')?.value as string | undefined;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export default class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptedTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  fieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  get mismatchError(): boolean {
    const ctrl = this.form.get('confirmPassword');
    return !!(
      ctrl?.touched &&
      (ctrl.invalid || this.form.hasError('passwordsMismatch'))
    );
  }

  get termsNotAccepted(): boolean {
    return !this.form.get('acceptedTerms')?.value;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { fullName, email, password, acceptedTerms } = this.form.value;

    try {
      await this.auth.register(fullName!, email!, password!, !!acceptedTerms, !!acceptedTerms);
      await this.router.navigate(['/']);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      this.error.set(
        msg.includes('LEGAL_NOT_ACCEPTED')
          ? 'Debes aceptar los Términos y la Política de Tratamiento de Datos para continuar.'
          : (msg || 'Error al crear la cuenta. Intenta de nuevo.'),
      );
    } finally {
      this.loading.set(false);
    }
  }
}
