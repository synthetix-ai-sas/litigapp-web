import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Bell, LogOut, LucideAngularModule, Scale } from 'lucide-angular';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent {
  noveltiesCount = input<number>(0);
  userInitials = input<string>('?');
  userName = input<string>('');
  logout = output<void>();
  bellClick = output<void>();

  protected readonly Scale = Scale;
  protected readonly Bell = Bell;
  protected readonly LogOut = LogOut;
}
