import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
      await this.router.navigateByUrl(returnUrl);
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : 'Error al iniciar sesión. Por favor intenta de nuevo.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
