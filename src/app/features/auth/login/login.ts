import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Scale, LogIn } from 'lucide-angular';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * TEMPORARY login (Persona B stub). Authenticates against the backend so the
 * dashboard can run end-to-end. Replaced by Cristian's 2.A auth UI.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly Scale = Scale;
  protected readonly LogIn = LogIn;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<{ accessToken: string }>(`${environment.apiBaseUrl}/auth/login`, this.form.getRawValue())
      .subscribe({
        next: (res) => {
          this.auth.setToken(res.accessToken);
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Credenciales inválidas o backend no disponible.');
        },
      });
  }
}
