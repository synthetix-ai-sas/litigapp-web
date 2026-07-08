import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  Scale,
  CircleAlert,
  User,
  Mail,
  MailCheck,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Link2Off,
  CheckCircle,
  FileText,
  ExternalLink,
  Shield,
  Trash2,
  MessageCircle,
} from 'lucide-angular';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/http/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Scale,
        CircleAlert,
        User,
        Mail,
        MailCheck,
        Lock,
        Eye,
        EyeOff,
        Loader2,
        ArrowLeft,
        Link2Off,
        CheckCircle,
        FileText,
        ExternalLink,
        Shield,
        Trash2,
        MessageCircle,
      }),
    },
  ],
};
