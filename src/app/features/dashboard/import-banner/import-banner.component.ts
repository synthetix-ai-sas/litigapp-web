import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, Upload } from 'lucide-angular';
import { ImportJob } from '../../../shared/domain/import';

@Component({
  selector: 'app-import-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './import-banner.component.html',
  styleUrl: './import-banner.component.css',
})
export class ImportBannerComponent {
  importJob = input<ImportJob | null>(null);
  protected readonly Upload = Upload;
}
