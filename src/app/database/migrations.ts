import { SqliteDriver } from './sqlite/sqlite.driver';

export async function runMigrations(driver: SqliteDriver): Promise<void> {
  await driver.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      full_name   TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'member'
                    CHECK(role IN ('superuser', 'project_admin', 'member')),
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      description TEXT,
      created_by  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role        TEXT NOT NULL DEFAULT 'member'
                    CHECK(role IN ('project_admin', 'member')),
      joined_at   TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      epic_id     TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'open'
                    CHECK(status IN ('open', 'active', 'closed')),
      is_epic     INTEGER NOT NULL DEFAULT 0 CHECK(is_epic IN (0, 1)),
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      position    INTEGER NOT NULL DEFAULT 0,
      created_by  TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_epic_id        ON tasks(epic_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee       ON tasks(assignee_id);

    CREATE TABLE IF NOT EXISTS comments (
      id          TEXT PRIMARY KEY,
      task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      body        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK(type IN ('success', 'error', 'info')),
      category    TEXT NOT NULL,
      message     TEXT NOT NULL,
      is_read     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
  `);
}
