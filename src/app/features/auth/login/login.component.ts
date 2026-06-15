import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
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
          <h1 class="text-xl font-bold text-slate-800 mb-6">Iniciar sesión</h1>

          <!-- Error -->
          @if (error()) {
            <div class="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <lucide-angular name="circle-alert" [size]="16" [strokeWidth]="2"
                class="mt-0.5 shrink-0 text-red-500" />
              <p class="text-sm text-red-700">{{ error() }}</p>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Email -->
            <div class="mb-4">
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
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-slate-50 disabled:text-slate-400"
                  [class.border-red-300]="emailInvalid"
                  [class.border-slate-300]="!emailInvalid"
                />
              </div>
              @if (emailInvalid) {
                <p class="mt-1 text-xs text-red-600">Ingresa un correo electrónico válido</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-1.5">
                <label for="password" class="text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <a
                  routerLink="/forgot-password"
                  class="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div class="relative">
                <lucide-angular name="lock" [size]="16" [strokeWidth]="1.5"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm transition-colors
                         placeholder:text-slate-400 outline-none
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-slate-50 disabled:text-slate-400"
                  [class.border-red-300]="passwordInvalid"
                  [class.border-slate-300]="!passwordInvalid"
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
              @if (passwordInvalid) {
                <p class="mt-1 text-xs text-red-600">La contraseña es requerida</p>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700
                     disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium
                     py-2.5 rounded-lg transition-colors text-sm shadow-sm"
            >
              @if (loading()) {
                <lucide-angular name="loader-2" [size]="16" [strokeWidth]="2"
                  class="animate-spin" />
                <span>Iniciando sesión...</span>
              } @else {
                <span>Iniciar sesión</span>
              }
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?
          <a routerLink="/register"
            class="ml-1 font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Regístrate gratis
          </a>
        </p>
      </div>
    </div>
  `,
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get emailCtrl(): AbstractControl {
    return this.form.controls.email;
  }

  get passwordCtrl(): AbstractControl {
    return this.form.controls.password;
  }

  get emailInvalid(): boolean {
    return this.emailCtrl.invalid && this.emailCtrl.touched;
  }

  get passwordInvalid(): boolean {
    return this.passwordCtrl.invalid && this.passwordCtrl.touched;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.login(this.emailCtrl.value as string, this.passwordCtrl.value as string);
      await this.router.navigate(['/']);
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : 'Error al iniciar sesión. Intenta de nuevo.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
