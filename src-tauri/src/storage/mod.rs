// ============================================================================
// Storage Module - SQLite database operations
// ============================================================================

use rusqlite::{Connection, Result};
use std::path::Path;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref DB: Mutex<Option<Connection>> = Mutex::new(None);
}

/// Initialize the SQLite database
pub fn init_database(path: &Path) -> Result<()> {
    let conn = Connection::open(path)?;

    // Create tables
    conn.execute_batch(
        "
        -- Files metadata cache
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            path TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            file_type TEXT,
            size INTEGER NOT NULL,
            modified_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            extension TEXT,
            parent_path TEXT,
            content_hash TEXT,
            indexed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Change history for undo
        CREATE TABLE IF NOT EXISTS change_log (
            id TEXT PRIMARY KEY,
            batch_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            source_path TEXT NOT NULL,
            destination_path TEXT,
            file_data TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            is_undone INTEGER DEFAULT 0
        );

        -- History batches
        CREATE TABLE IF NOT EXISTS history_batches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            is_undone INTEGER DEFAULT 0
        );

        -- User preferences
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Custom organization rules
        CREATE TABLE IF NOT EXISTS rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            pattern TEXT NOT NULL,
            destination TEXT NOT NULL,
            priority INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
        CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
        CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_path);
        CREATE INDEX IF NOT EXISTS idx_change_log_batch ON change_log(batch_id);
        CREATE INDEX IF NOT EXISTS idx_change_log_timestamp ON change_log(timestamp);
        ",
    )?;

    *DB.lock().unwrap() = Some(conn);
    Ok(())
}

/// Get database connection
pub fn get_connection() -> Option<std::sync::MutexGuard<'static, Option<Connection>>> {
    DB.lock().ok()
}
