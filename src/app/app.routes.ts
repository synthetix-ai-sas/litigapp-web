import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component'),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component'),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component'),
  },

  // Authenticated routes
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component'),
    children: [
      { path: '', redirectTo: 'novelties', pathMatch: 'full' },
      {
        path: 'novelties',
        loadComponent: () =>
          import('./features/dashboard/novelties-tab/novelties-tab.component'),
      },
      {
        path: 'processes',
        loadComponent: () =>
          import('./features/dashboard/processes-tab/processes-tab.component'),
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
