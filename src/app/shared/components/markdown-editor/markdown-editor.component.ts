import {
  Component, forwardRef, ViewChild, ElementRef, Input, ChangeDetectionStrategy
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MarkdownViewerComponent } from '../markdown-viewer/markdown-viewer.component';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatTabsModule, MarkdownViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MarkdownEditorComponent), multi: true }
  ],
  template: `
    <div class="md-editor">
      <div class="md-toolbar">
        <button mat-icon-button type="button" matTooltip="Bold" (click)="wrap('**','**')">
          <mat-icon>format_bold</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Italic" (click)="wrap('*','*')">
          <mat-icon>format_italic</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Inline code" (click)="wrap('\`','\`')">
          <mat-icon>code</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Code block" (click)="insertCodeBlock()">
          <mat-icon>integration_instructions</mat-icon>
        </button>
        <div class="toolbar-sep"></div>
        <button mat-button type="button" class="heading-btn" matTooltip="Heading 1" (click)="prependLine('# ')">H1</button>
        <button mat-button type="button" class="heading-btn" matTooltip="Heading 2" (click)="prependLine('## ')">H2</button>
        <button mat-button type="button" class="heading-btn" matTooltip="Heading 3" (click)="prependLine('### ')">H3</button>
        <div class="toolbar-sep"></div>
        <button mat-icon-button type="button" matTooltip="Bullet list" (click)="prependLine('- ')">
          <mat-icon>format_list_bulleted</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Numbered list" (click)="prependLine('1. ')">
          <mat-icon>format_list_numbered</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Horizontal rule" (click)="insertAtCursor('\\n---\\n')">
          <mat-icon>horizontal_rule</mat-icon>
        </button>
        <div class="toolbar-sep"></div>
        <button mat-icon-button type="button" matTooltip="Insert image" (click)="imgInput.click()">
          <mat-icon>image</mat-icon>
        </button>
        <input #imgInput type="file" accept="image/*" style="display:none" (change)="onImageFile($event)">
      </div>

      <mat-tab-group animationDuration="0ms" class="md-tabs">
        <mat-tab label="Write">
          <textarea
            #textarea
            class="md-textarea"
            [value]="value"
            (input)="onInput($event)"
            [placeholder]="placeholder"
            [disabled]="isDisabled"
          ></textarea>
        </mat-tab>
        <mat-tab label="Preview">
          <div class="md-preview">
            <app-markdown-viewer [content]="value || '*Nothing to preview*'"></app-markdown-viewer>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .md-editor {
      border: 1px solid var(--color-border);
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }
    .md-toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 8px;
      background: #f6f8fa;
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
    }
    .toolbar-sep {
      width: 1px;
      height: 20px;
      background: var(--color-border);
      margin: 0 4px;
    }
    .heading-btn {
      font-size: 11px;
      font-weight: 700;
      min-width: 28px;
      height: 28px;
      line-height: 28px;
      padding: 0 6px;
    }
    .md-tabs { background: white; }
    .md-textarea {
      width: 100%;
      min-height: 160px;
      padding: 12px;
      border: none;
      outline: none;
      resize: vertical;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      box-sizing: border-box;
      background: white;
      color: #24292f;
    }
    .md-textarea:disabled { background: #f6f8fa; color: #6e7781; }
    .md-preview { padding: 12px; min-height: 160px; }
  `]
})
export class MarkdownEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'Write markdown here...';
  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  value = '';
  isDisabled = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string): void { this.value = v || ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }

  onInput(e: Event): void {
    this.value = (e.target as HTMLTextAreaElement).value;
    this.onChange(this.value);
    this.onTouched();
  }

  private get ta(): HTMLTextAreaElement {
    return this.textareaRef.nativeElement;
  }

  wrap(before: string, after: string): void {
    const ta = this.ta;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end) || 'text';
    const newText = before + sel + after;
    this.replaceSelection(start, end, newText, start + before.length, start + before.length + sel.length);
  }

  insertCodeBlock(): void {
    const ta = this.ta;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end) || 'code';
    const newText = '```\n' + sel + '\n```';
    this.replaceSelection(start, end, newText, start + 4, start + 4 + sel.length);
  }

  prependLine(prefix: string): void {
    const ta = this.ta;
    const start = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = ta.value.indexOf('\n', start);
    const end = lineEnd === -1 ? ta.value.length : lineEnd;
    const line = ta.value.slice(lineStart, end);
    const newLine = prefix + line;
    this.replaceSelection(lineStart, end, newLine, lineStart + prefix.length, lineStart + newLine.length);
  }

  insertAtCursor(text: string): void {
    const ta = this.ta;
    const start = ta.selectionStart;
    this.replaceSelection(start, ta.selectionEnd, text, start + text.length, start + text.length);
  }

  private replaceSelection(start: number, end: number, text: string, selStart: number, selEnd: number): void {
    const ta = this.ta;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    this.value = before + text + after;
    ta.value = this.value;
    ta.setSelectionRange(selStart, selEnd);
    ta.focus();
    this.onChange(this.value);
  }

  onImageFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large. Please use images under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.insertAtCursor(`![${file.name}](${dataUrl})`);
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }
}
