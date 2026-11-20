import { DatabaseSync } from 'node:sqlite';

export function openLinkRepository(filename) {
  const db = new DatabaseSync(filename);
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS links (
        slug TEXT PRIMARY KEY,
        destination TEXT NOT NULL
      ) STRICT
    `);
    const select = db.prepare('SELECT destination FROM links WHERE slug = ?');
    const update = db.prepare('UPDATE links SET destination = ? WHERE slug = ?');
    const insert = db.prepare(`
      INSERT INTO links (slug, destination) VALUES (?, ?)
      ON CONFLICT (slug) DO NOTHING
    `);

    return {
      get: slug => select.get(slug)?.destination ?? null,
      update: (slug, destination) => update.run(destination, slug).changes === 1,
      seed: (slug, destination) => insert.run(slug, destination),
      close: () => db.close(),
    };
  } catch (error) {
    db.close();
    throw error;
  }
}
