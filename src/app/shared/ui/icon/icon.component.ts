import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-angular [name]="name()" [size]="size()" [strokeWidth]="1.5" />`,
})
export class IconComponent {
  name = input<string>('');
  size = input<number>(20);
}
