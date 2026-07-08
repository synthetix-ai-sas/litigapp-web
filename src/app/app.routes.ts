import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppShellComponent } from './shared/ui/layouts/app-shell/app-shell.component';

export const routes: Routes = [
  // Public-only routes (redirect to / if already authenticated)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component'),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component'),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component'),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component'),
  },

  // Public legal routes — no auth required
  {
    path: 'legal',
    children: [
      {
        path: 'terminos',
        data: { title: 'Términos y Condiciones', file: 'terminos.v1.0.md' },
        loadComponent: () =>
          import('./features/legal/legal-page/legal-page.component'),
      },
      {
        path: 'privacidad',
        data: { title: 'Política de Tratamiento de Datos Personales', file: 'privacidad.v1.0.md' },
        loadComponent: () =>
          import('./features/legal/legal-page/legal-page.component'),
      },
    ],
  },

  // Authenticated routes — AppShell provee header + footer para todas
  {
    path: '',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component'),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
