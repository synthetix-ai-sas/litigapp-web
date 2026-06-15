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
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div class="w-full max-w-md">

        <!-- Brand -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center gap-2.5 text-blue-700">
            <lucide-angular name="scale" [size]="32" [strokeWidth]="2" />
            <span class="text-2xl font-bold tracking-tight">LitigApp</span>
          </div>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl px-8 py-8">

          <!-- Invalid / expired link -->
          @if (state() === 'invalid-link') {
            <div class="text-center py-4">
              <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-angular name="link-2-off" [size]="28" [strokeWidth]="1.5" class="text-red-500" />
              </div>
              <h1 class="text-xl font-bold text-slate-800 mb-2">Enlace inválido</h1>
              <p class="text-sm text-slate-500 mb-6">
                El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.
              </p>
              <a
                routerLink="/forgot-password"
                class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       font-medium py-2.5 px-5 rounded-lg transition-colors text-sm shadow-sm"
              >
                Solicitar nuevo enlace
              </a>
            </div>
          }

          <!-- Form -->
          @if (state() === 'form') {
            <div class="mb-6">
              <h1 class="text-xl font-bold text-slate-800">Nueva contraseña</h1>
              <p class="mt-1.5 text-sm text-slate-500">
                Ingresa y confirma tu nueva contraseña para
                <span class="font-medium text-slate-700">{{ email }}</span>.
              </p>
            </div>

            @if (error()) {
              <div class="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <lucide-angular name="circle-alert" [size]="16" [strokeWidth]="2"
                  class="mt-0.5 shrink-0 text-red-500" />
                <p class="text-sm text-red-700">{{ error() }}</p>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-4">
              <!-- New password -->
              <div>
                <label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">
                  Nueva contraseña
                </label>
                <div class="relative">
                  <lucide-angular name="lock" [size]="16" [strokeWidth]="1.5"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    class="w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm transition-colors
                           placeholder:text-slate-400 outline-none
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    [class.border-red-300]="fieldInvalid('password')"
                    [class.border-slate-300]="!fieldInvalid('password')"
                  />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                           hover:text-slate-600 transition-colors"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <lucide-angular
                      [name]="showPassword() ? 'eye-off' : 'eye'"
                      [size]="16" [strokeWidth]="1.5" />
                  </button>
                </div>
                @if (fieldInvalid('password')) {
                  <p class="mt-1 text-xs text-red-600">La contraseña debe tener al menos 8 caracteres</p>
                }
              </div>

              <!-- Confirm password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <div class="relative">
                  <lucide-angular name="lock" [size]="16" [strokeWidth]="1.5"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    placeholder="Repite tu nueva contraseña"
                    class="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm transition-colors
                           placeholder:text-slate-400 outline-none
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    [class.border-red-300]="mismatchError"
                    [class.border-slate-300]="!mismatchError"
                  />
                </div>
                @if (mismatchError) {
                  <p class="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                }
              </div>

              <button
                type="submit"
                [disabled]="loading()"
                class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
                       disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                       py-2.5 rounded-lg transition-colors text-sm shadow-sm"
              >
                @if (loading()) {
                  <lucide-angular name="loader-2" [size]="16" [strokeWidth]="2" class="animate-spin" />
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar nueva contraseña</span>
                }
              </button>
            </form>
          }

          <!-- Success -->
          @if (state() === 'success') {
            <div class="text-center py-4">
              <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-angular name="check-circle" [size]="28" [strokeWidth]="1.5" class="text-green-600" />
              </div>
              <h1 class="text-xl font-bold text-slate-800 mb-2">Contraseña actualizada</h1>
              <p class="text-sm text-slate-500 mb-6">
                Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
              </p>
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                       font-medium py-2.5 px-5 rounded-lg transition-colors text-sm shadow-sm"
              >
                Iniciar sesión
              </a>
            </div>
          }

        </div>
      </div>
    </div>
  `,
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
