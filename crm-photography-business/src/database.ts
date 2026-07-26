import Database from "better-sqlite3";

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS photographers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS convocation_events (
      id TEXT PRIMARY KEY,
      university TEXT NOT NULL,
      faculty TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      photographer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS add_ons (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS time_slot_opt_ins (
      photographer_id TEXT NOT NULL,
      convocation_event_id TEXT NOT NULL,
      PRIMARY KEY (photographer_id, convocation_event_id)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id TEXT PRIMARY KEY,
      photographer_id TEXT NOT NULL,
      convocation_event_id TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      time_slot_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      add_on_ids TEXT NOT NULL,
      convocation_event_id TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      commitment_payment TEXT,
      payout_released_at TEXT,
      cancelled_by TEXT,
      cancelled_at TEXT,
      refunded INTEGER,
      final_payment TEXT,
      delivery_link TEXT
    );

    CREATE TABLE IF NOT EXISTS convocation_leads (
      id TEXT PRIMARY KEY,
      university TEXT NOT NULL,
      date TEXT NOT NULL,
      venue TEXT,
      dismissed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scraper_source_runs (
      source_id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      ran_at TEXT NOT NULL
    );
  `);
}

export function openDatabase(path: string): Database.Database {
  const db = new Database(path);
  initializeSchema(db);
  return db;
}
