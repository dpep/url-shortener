import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function openLinkRepository(filename: string) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        slug TEXT PRIMARY KEY,
        destination TEXT NOT NULL
      ) STRICT
    `);
    const select = db.prepare('SELECT destination FROM links WHERE slug = ?');
    const insert = db.prepare(`
      INSERT INTO links (slug, destination) VALUES (?, ?)
      ON CONFLICT (slug) DO NOTHING
    `);

    return {
      get(slug: string) {
        const destination = select.get(slug)?.destination;
        return typeof destination === 'string' ? destination : null;
      },
      insert: (slug: string, destination: string) => insert.run(slug, destination).changes === 1,
      close: () => db.close(),
    };
  } catch (error) {
    db.close();
    throw error;
  }
}
