export function getDatabasePath(): string {
  const path = process.env.DATABASE_PATH;
  if (!path?.trim()) throw new Error('Set DATABASE_PATH in .env.');
  return path;
}
