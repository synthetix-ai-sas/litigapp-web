import { Component, inject, signal, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { AuthDataAccessService } from '../../../data-access/auth.service';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw = group.get('password')?.value as string | undefined;
  const confirm = group.get('confirmPassword')?.value as string | undefined;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
};

type PageState = 'form' | 'success' | 'invalid-link';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export default class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authData = inject(AuthDataAccessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  state = signal<PageState>('form');

  email = '';
  private token = '';

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.token = params.get('token') ?? '';
    this.email = params.get('email') ?? '';

    if (!this.token || !this.email) {
      this.state.set('invalid-link');
    }
  }

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

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading() || this.state() !== 'form') return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.authData.confirmPasswordReset({
          resetToken: this.token,
          email: this.email,
          newPassword: this.form.value.password!,
        }),
      );

      this.state.set('success');
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 400) {
        this.state.set('invalid-link');
      } else {
        this.error.set('Error al restablecer la contraseña. Intenta de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
