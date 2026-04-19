import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { SqliteDriver } from './sqlite/sqlite.driver';

const SUPERUSER_EMAIL = 'admin@bugtracker.com';
const SUPERUSER_PASSWORD = 'Admin123!';

export async function runSeed(driver: SqliteDriver): Promise<void> {
  const existing = driver.query<{ id: string }>(
    `SELECT id FROM users WHERE email = ?`,
    [SUPERUSER_EMAIL]
  );

  if (existing.length > 0) return;

  const hash = await bcrypt.hash(SUPERUSER_PASSWORD, 10);
  const now = new Date().toISOString();

  await driver.run(
    `INSERT INTO users (id, email, password, full_name, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), SUPERUSER_EMAIL, hash, 'Super Admin', 'superuser', 1, now, now]
  );

  console.log('[seed] Superuser created: admin@bugtracker.com / Admin123!');
}
