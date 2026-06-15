import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { AuthDataAccessService } from '../../../data-access/auth.service';

type PageState = 'form' | 'success';

@Component({
  selector: 'app-forgot-password',
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

          @if (state() === 'form') {
            <div class="mb-6">
              <h1 class="text-xl font-bold text-slate-800">Recuperar contraseña</h1>
              <p class="mt-1.5 text-sm text-slate-500">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <!-- Error -->
            @if (error()) {
              <div class="mb-5 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <lucide-angular name="circle-alert" [size]="16" [strokeWidth]="2"
                  class="mt-0.5 shrink-0 text-red-500" />
                <p class="text-sm text-red-700">{{ error() }}</p>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <div class="mb-6">
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
                    [class.border-red-300]="emailInvalid"
                    [class.border-slate-300]="!emailInvalid"
                  />
                </div>
                @if (emailInvalid) {
                  <p class="mt-1 text-xs text-red-600">Ingresa un correo electrónico válido</p>
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
                  <span>Enviando...</span>
                } @else {
                  <span>Enviar enlace</span>
                }
              </button>
            </form>
          }

          @if (state() === 'success') {
            <div class="text-center py-4">
              <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-angular name="mail-check" [size]="28" [strokeWidth]="1.5" class="text-green-600" />
              </div>
              <h1 class="text-xl font-bold text-slate-800 mb-2">Revisa tu correo</h1>
              <p class="text-sm text-slate-500 mb-6">
                Si el correo existe en nuestra base de datos, recibirás un enlace en los próximos
                minutos.
              </p>
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 text-sm font-medium text-blue-600
                       hover:text-blue-700 transition-colors"
              >
                <lucide-angular name="arrow-left" [size]="16" [strokeWidth]="1.5" />
                Volver a iniciar sesión
              </a>
            </div>
          }

        </div>

        <!-- Footer -->
        @if (state() === 'form') {
          <p class="mt-6 text-center text-sm text-slate-500">
            <a routerLink="/login"
              class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium">
              <lucide-angular name="arrow-left" [size]="14" [strokeWidth]="1.5" />
              Volver a iniciar sesión
            </a>
          </p>
        }
      </div>
    </div>
  `,
})
export default class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authData = inject(AuthDataAccessService);

  loading = signal(false);
  error = signal<string | null>(null);
  state = signal<PageState>('form');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailInvalid(): boolean {
    const ctrl = this.form.controls.email;
    return ctrl.invalid && ctrl.touched;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.authData.requestPasswordReset(this.form.value.email!),
      );
      this.state.set('success');
    } catch {
      // Always show success to avoid email enumeration
      this.state.set('success');
    } finally {
      this.loading.set(false);
    }
  }
}
