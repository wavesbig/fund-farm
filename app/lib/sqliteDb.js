import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

let dbInstance = null;

/**
 * 获取或初始化 SQLite 数据库实例
 */
export function getSqliteDb() {
  if (dbInstance) return dbInstance;

  // 数据存储在项目根目录下的 data 目录
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'fund.db');
  const db = new DatabaseSync(dbPath);

  // 启用 WAL 模式提高读写并发性能
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA synchronous = NORMAL;');
  } catch (e) {
    // 忽略特定环境下的 PRAGMA 异常
  }

  // 初始化键值存储表
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_time TEXT,
      version INTEGER DEFAULT 1
    );

    INSERT OR IGNORE INTO sync_meta (id, last_sync_time, version)
    VALUES (1, datetime('now'), 1);
  `);

  dbInstance = db;
  return dbInstance;
}

/**
 * 获取所有键值对
 * @returns {Record<string, any>}
 */
export function getAllData() {
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT key, value, updated_at FROM kv_store');
  const rows = stmt.all();

  const result = {};
  let latestUpdatedAt = null;

  for (const row of rows) {
    let parsedValue = row.value;
    try {
      parsedValue = JSON.parse(row.value);
    } catch {
      // 保持原始字符串
    }
    result[row.key] = parsedValue;

    if (!latestUpdatedAt || (row.updated_at && row.updated_at > latestUpdatedAt)) {
      latestUpdatedAt = row.updated_at;
    }
  }

  return { data: result, updatedAt: latestUpdatedAt };
}

/**
 * 获取单个 key 的数据
 * @param {string} key
 * @returns {any}
 */
export function getDataByKey(key) {
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT value FROM kv_store WHERE key = ?');
  const row = stmt.get(key);
  if (!row) return null;

  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

/**
 * 批量保存键值对（事务操作）
 * @param {Record<string, any>} dataMap
 * @returns {{ count: number, updatedAt: string }}
 */
export function setBatchData(dataMap) {
  if (!dataMap || typeof dataMap !== 'object') {
    return { count: 0, updatedAt: new Date().toISOString() };
  }

  const db = getSqliteDb();
  const now = new Date().toISOString();
  const entries = Object.entries(dataMap);

  db.exec('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)');

    for (const [key, value] of entries) {
      if (key == null || key === '') continue;
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      stmt.run(key, strValue, now);
    }

    // 更新最后同步元信息
    const metaStmt = db.prepare('UPDATE sync_meta SET last_sync_time = ? WHERE id = 1');
    metaStmt.run(now);

    db.exec('COMMIT;');
    return { count: entries.length, updatedAt: now };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * 设置单个键值对
 * @param {string} key
 * @param {any} value
 */
export function setData(key, value) {
  return setBatchData({ [key]: value });
}

/**
 * 删除指定 key
 * @param {string} key
 */
export function deleteKey(key) {
  const db = getSqliteDb();
  const stmt = db.prepare('DELETE FROM kv_store WHERE key = ?');
  stmt.run(key);
}

/**
 * 清空所有数据
 */
export function clearAll() {
  const db = getSqliteDb();
  db.exec('DELETE FROM kv_store;');
}
