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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
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
