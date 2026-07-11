import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule, Upload } from 'lucide-angular';
import { ImportProgressService } from '../../../core/import-progress/import-progress.service';

@Component({
  selector: 'app-import-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './import-banner.component.html',
  styleUrl: './import-banner.component.css',
})
export class ImportBannerComponent {
  protected readonly importProgress = inject(ImportProgressService);
  protected readonly Upload = Upload;
}
