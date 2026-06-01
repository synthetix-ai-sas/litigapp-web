import { Component, input } from '@angular/core';

/**
 * Wrapper around lucide-angular icons.
 * Full implementation comes in Step 15.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="app-icon"></span>`,
})
export class IconComponent {
  name = input<string>('');
  size = input<number>(20);
}
