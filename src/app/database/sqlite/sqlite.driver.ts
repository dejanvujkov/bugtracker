import { Injectable } from '@angular/core';
import initSqlJs, { Database, QueryExecResult, SqlJsStatic } from 'sql.js';

@Injectable({ providedIn: 'root' })
export class SqliteDriver {
  private db!: Database;
  private _ready = false;

  get isReady(): boolean {
    return this._ready;
  }

  async init(): Promise<void> {
    const SQL: SqlJsStatic = await initSqlJs({
      locateFile: () => '/assets/sql-wasm.wasm',
    });

    const saved = await this.loadFromOpfs();
    this.db = saved ? new SQL.Database(saved) : new SQL.Database();

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON;');
    this._ready = true;
  }

  query<T = Record<string, unknown>>(sql: string, params: (string | number | null)[] = []): T[] {
    const results: QueryExecResult[] = this.db.exec(sql, params);
    if (!results.length) return [];

    const { columns, values } = results[0];
    return values.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => (obj[col] = row[i]));
      return obj as T;
    });
  }

  async run(sql: string, params: (string | number | null | boolean)[] = []): Promise<void> {
    this.db.run(sql, params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p));
    await this.persist();
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
    await this.persist();
  }

  /** Serialize DB to OPFS for persistence */
  async persist(): Promise<void> {
    const data = this.db.export();
    try {
      const root = await navigator.storage.getDirectory();
      const fh = await root.getFileHandle('bugtracker.db', { create: true });
      const writable = await (fh as any).createWritable();
      await writable.write(data);
      await writable.close();
    } catch {
      // Fallback to localStorage for browsers without OPFS
      try {
        // Avoid spread operator — it overflows the call stack for large Uint8Arrays
        let binary = '';
        for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
        localStorage.setItem('bugtracker_db', btoa(binary));
      } catch {
        console.warn('Could not persist database');
      }
    }
  }

  private async loadFromOpfs(): Promise<Uint8Array | null> {
    // Try OPFS first
    try {
      const root = await navigator.storage.getDirectory();
      const fh = await root.getFileHandle('bugtracker.db');
      const file = await (fh as any).getFile();
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      // Fallback: try localStorage
      try {
        const base64 = localStorage.getItem('bugtracker_db');
        if (!base64) return null;
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      } catch {
        return null;
      }
    }
  }
}
