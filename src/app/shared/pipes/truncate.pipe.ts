import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string | null | undefined, limit = 80): string {
    if (!value) return '';
    // Strip markdown syntax for plain-text preview
    const plain = value
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*|__|\*|_|~~|`{1,3}/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '[image]')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > limit ? plain.slice(0, limit) + '…' : plain;
  }
}
