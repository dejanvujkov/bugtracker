import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

// Configure marked with syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

marked.setOptions({ gfm: true, breaks: true });

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="md-content" [innerHTML]="html"></div>`,
  styles: [`
    .md-content {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.7;
      color: #24292f;
      word-break: break-word;
    }
    .md-content :global(h1) { font-size: 1.5em; margin: 0.5em 0; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
    .md-content :global(h2) { font-size: 1.25em; margin: 0.5em 0; }
    .md-content :global(h3) { font-size: 1.1em; margin: 0.5em 0; }
    .md-content :global(code) { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 13px; }
    .md-content :global(pre) { background: #0d1117; color: #c9d1d9; padding: 16px; border-radius: 6px; overflow-x: auto; }
    .md-content :global(pre code) { background: none; padding: 0; color: inherit; }
    .md-content :global(blockquote) { border-left: 4px solid var(--color-border); margin: 0; padding-left: 1em; color: #6e7781; }
    .md-content :global(img) { max-width: 100%; border-radius: 4px; }
    .md-content :global(a) { color: var(--color-primary); }
    .md-content :global(table) { border-collapse: collapse; width: 100%; }
    .md-content :global(th), .md-content :global(td) { border: 1px solid var(--color-border); padding: 6px 12px; }
    .md-content :global(th) { background: #f6f8fa; }
    .md-content :global(ul), .md-content :global(ol) { padding-left: 1.5em; }
    .md-content :global(hr) { border: none; border-top: 1px solid var(--color-border); }
  `]
})
export class MarkdownViewerComponent implements OnChanges {
  @Input() content = '';
  html = '';

  ngOnChanges(): void {
    const raw = marked.parse(this.content || '') as string;
    this.html = DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] });
  }
}
