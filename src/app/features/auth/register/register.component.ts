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
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div class="w-full max-w-md">

        <!-- Brand -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center gap-2.5 text-blue-700">
            <lucide-angular name="scale" [size]="32" [strokeWidth]="2" />
            <span class="text-2xl font-bold tracking-tight">LitigApp</span>
          </div>
          <p class="mt-1.5 text-sm text-slate-500">Monitoreo de procesos judiciales</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl px-8 py-8">
          <h1 class="text-xl font-bold text-slate-800 mb-6">Crear cuenta</h1>

          <!-- Error -->
          @if (error()) {
            <div class="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <lucide-angular name="circle-alert" [size]="16" [strokeWidth]="2"
                class="mt-0.5 shrink-0 text-red-500" />
              <p class="text-sm text-red-700">{{ error() }}</p>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-4">

            <!-- Full name -->
            <div>
              <label for="fullName" class="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre completo
              </label>
              <div class="relative">
                <lucide-angular name="user" [size]="16" [strokeWidth]="1.5"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  formControlName="fullName"
                  autocomplete="name"
                  placeholder="Carlos Rodríguez"
                  class="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm transition-colors
                         placeholder:text-slate-400 outline-none
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  [class.border-red-300]="fieldInvalid('fullName')"
                  [class.border-slate-300]="!fieldInvalid('fullName')"
                />
              </div>
              @if (fieldInvalid('fullName')) {
                <p class="mt-1 text-xs text-red-600">El nombre es requerido</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div class="relative">
                <lucide-angular name="mail" [size]="16" [strokeWidth]="1.5"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="tu@email.com"
                  class="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm transition-colors
                         placeholder:text-slate-400 outline-none
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  [class.border-red-300]="fieldInvalid('email')"
                  [class.border-slate-300]="!fieldInvalid('email')"
                />
              </div>
              @if (fieldInvalid('email')) {
                <p class="mt-1 text-xs text-red-600">Ingresa un correo electrónico válido</p>
              }
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
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
                  placeholder="Repite tu contraseña"
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

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
                     disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                     py-2.5 rounded-lg transition-colors text-sm shadow-sm mt-2"
            >
              @if (loading()) {
                <lucide-angular name="loader-2" [size]="16" [strokeWidth]="2" class="animate-spin" />
                <span>Creando cuenta...</span>
              } @else {
                <span>Crear cuenta</span>
              }
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?
          <a routerLink="/login"
            class="ml-1 font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  `,
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

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const { fullName, email, password } = this.form.value;

    try {
      await this.auth.register(fullName!, email!, password!);
      await this.router.navigate(['/']);
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : 'Error al crear la cuenta. Intenta de nuevo.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
