import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import { switchMap } from 'rxjs';

function closeList(out: string[], inList: boolean): boolean {
  if (inList) out.push('</ul>');
  return false;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function renderMd(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      inList = closeList(out, inList);
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      inList = closeList(out, inList);
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      inList = closeList(out, inList);
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ')) {
      inList = closeList(out, inList);
      out.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`);
    } else if (line.startsWith('- ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
    } else if (line === '---') {
      inList = closeList(out, inList);
      out.push('<hr>');
    } else if (line === '') {
      inList = closeList(out, inList);
    } else {
      inList = closeList(out, inList);
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeList(out, inList);
  return out.join('\n');
}

@Component({
  selector: 'app-legal-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.css',
})
export default class LegalPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly htmlContent = signal<SafeHtml>('');
  protected readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.route.data
      .pipe(
        switchMap(data => {
          this.loading.set(true);
          this.error.set(null);
          return this.http.get(`/legal/${data['file'] as string}`, { responseType: 'text' });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: md => {
          this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(renderMd(md)));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el documento. Por favor intenta más tarde.');
          this.loading.set(false);
        },
      });
  }
}
