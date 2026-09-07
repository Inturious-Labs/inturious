import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', '..', 'migrations');

let db;

export function open(path) {
  mkdirSync(dirname(path), { recursive: true });
  db = new Database(path);
  // WAL lets reads proceed during writes; both live in this process, but the CLI and
  // any backup reader also touch the file.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function get() {
  if (!db) throw new Error('database not opened');
  return db;
}

// Applies every .sql file in migrations/ that has not run yet, in filename order.
export function migrate() {
  const d = get();
  d.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, ts INTEGER NOT NULL)');
  const done = new Set(d.prepare('SELECT name FROM _migrations').all().map(r => r.name));
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const applied = [];
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = readFileSync(join(migrationsDir, f), 'utf8');
    d.transaction(() => {
      d.exec(sql);
      d.prepare('INSERT INTO _migrations (name, ts) VALUES (?, ?)').run(f, Math.floor(Date.now() / 1000));
    })();
    applied.push(f);
  }
  return applied;
}
