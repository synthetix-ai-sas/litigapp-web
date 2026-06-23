import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppHeaderComponent } from '../../organisms/app-header/app-header.component';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppHeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  noveltiesCount = input<number>(0);
  logout = output<void>();
}
