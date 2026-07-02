import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { NoveltiesCountService } from '../../../../core/novelties/novelties-count.service';
import { AppHeaderComponent } from '../../organisms/app-header/app-header.component';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly noveltiesCount = inject(NoveltiesCountService);

  protected readonly count = this.noveltiesCount.count;

  ngOnInit(): void {
    this.noveltiesCount.startPolling();
  }

  ngOnDestroy(): void {
    this.noveltiesCount.stopPolling();
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
