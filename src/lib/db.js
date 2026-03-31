import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use a hidden directory for the database to keep project root clean
const dbDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'magiiv.db'), { 
  // verbose: console.log 
});

// Enable WAL mode for better concurrency performance
db.pragma('journal_mode = WAL');

// Initialize schema
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_users (
      id TEXT PRIMARY KEY, /* A UUID or generated id */
      role TEXT DEFAULT 'admin', /* 'admin', 'operador', 'viewer' */
      name TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ml_accounts (
      id TEXT PRIMARY KEY, /* ML user_id / seller_id */
      system_user_id TEXT,
      nickname TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      thumbnail TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (system_user_id) REFERENCES system_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_sessions (
      id TEXT PRIMARY KEY, /* Session ID to store in cookie */
      system_user_id TEXT,
      expires_at INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (system_user_id) REFERENCES system_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS account_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ml_account_id TEXT,
      month TEXT, /* YYYY-MM */
      target_revenue DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ml_account_id, month),
      FOREIGN KEY (ml_account_id) REFERENCES ml_accounts(id) ON DELETE CASCADE
    );

    /* Phase 4: Pricing & Alerts */
    CREATE TABLE IF NOT EXISTS alert_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ml_account_id TEXT,
      type TEXT, /* 'stock_min', 'acos_max', 'buybox_loss' */
      threshold REAL,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ml_account_id, type),
      FOREIGN KEY (ml_account_id) REFERENCES ml_accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS item_configs (
      id TEXT PRIMARY KEY, /* ml_item_id */
      ml_account_id TEXT,
      min_price REAL,
      max_price REAL,
      auto_reprice INTEGER DEFAULT 0,
      custom_stock_min INTEGER,
      FOREIGN KEY (ml_account_id) REFERENCES ml_accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ml_account_id TEXT,
      type TEXT, /* 'danger', 'warning', 'info' */
      title TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ml_account_id) REFERENCES ml_accounts(id) ON DELETE CASCADE
    );
  `);
}

// Ensure the tables exist
initDB();

export default db;
