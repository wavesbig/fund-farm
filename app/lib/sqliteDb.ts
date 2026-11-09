import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { isObject, isString } from 'lodash';

const g = globalThis as unknown as { __fundFarmDb?: DatabaseSync };

/**
 * 获取或初始化 SQLite 数据库实例
 */
export function getSqliteDb(): DatabaseSync {
  if (g.__fundFarmDb) return g.__fundFarmDb;

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
    db.exec('PRAGMA busy_timeout = 5000;');
  } catch {
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

  g.__fundFarmDb = db;
  return g.__fundFarmDb;
}

/**
 * 获取所有键值对
 */
export function getAllData(): { data: Record<string, any>; updatedAt: string | null } {
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT key, value, updated_at FROM kv_store');
  const rows = stmt.all() as Array<{ key: string; value: string; updated_at?: string }>;

  const result: Record<string, any> = {};
  let latestUpdatedAt: string | null = null;

  for (const row of rows) {
    let parsedValue: any = row.value;
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
 */
export function getDataByKey(key: string): any {
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT value FROM kv_store WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  if (!row) return null;

  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

/**
 * 批量保存键值对（事务操作，带冲突重试）
 */
export function setBatchData(dataMap: unknown): { count: number; updatedAt: string } {
  if (!dataMap || !isObject(dataMap)) {
    return { count: 0, updatedAt: new Date().toISOString() };
  }

  const db = getSqliteDb();
  const now = new Date().toISOString();
  const entries = Object.entries(dataMap as Record<string, unknown>);

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      db.exec('BEGIN IMMEDIATE;');
      const stmt = db.prepare('INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)');

      for (const [key, value] of entries) {
        if (key == null || key === '') continue;
        const strValue = isString(value) ? value : JSON.stringify(value);
        stmt.run(key, strValue, now);
      }

      // 更新最后同步元信息
      const metaStmt = db.prepare('UPDATE sync_meta SET last_sync_time = ? WHERE id = 1');
      metaStmt.run(now);

      db.exec('COMMIT;');
      return { count: entries.length, updatedAt: now };
    } catch (err: any) {
      try {
        db.exec('ROLLBACK;');
      } catch {
        // 忽略 rollback 失败
      }
      attempt++;
      if (attempt >= maxRetries || !err?.message?.includes('busy')) {
        throw err;
      }
      // 简单自旋等待
      const start = Date.now();
      while (Date.now() - start < 50) {
        /* wait 50ms */
      }
    }
  }

  return { count: entries.length, updatedAt: now };
}

/**
 * 设置单个键值对
 */
export function setData(key: string, value: any): { count: number; updatedAt: string } {
  return setBatchData({ [key]: value });
}

/**
 * 删除指定 key
 */
export function deleteKey(key: string): void {
  const db = getSqliteDb();
  const stmt = db.prepare('DELETE FROM kv_store WHERE key = ?');
  stmt.run(key);
}

/**
 * 清空所有数据
 */
export function clearAll(): void {
  const db = getSqliteDb();
  db.exec('DELETE FROM kv_store;');
}
