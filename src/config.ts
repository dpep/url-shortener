export function getDatabasePath(): string {
  const path = process.env.DATABASE_PATH;
  if (!path?.trim()) throw new Error('Ensure DATABASE_PATH is set');
  return path;
}
