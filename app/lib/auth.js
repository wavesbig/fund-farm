import crypto from 'node:crypto';
import { getSqliteDb } from './sqliteDb';

/**
 * 初始化认证相关的 SQLite 数据表
 */
export function initAuthTable() {
  const db = getSqliteDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT,
      salt TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT,
      expires_at TEXT
    );
  `);
}

/**
 * 检查当前系统是否已设置访问密码
 * @returns {boolean}
 */
export function isPasswordSet() {
  // 1. 如果环境变量指定了密码，视为已设置
  if (process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim() !== '') {
    return true;
  }

  // 2. 检查 SQLite 中的记录
  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT password_hash FROM auth_meta WHERE id = 1');
  const row = stmt.get();
  return Boolean(row?.password_hash);
}

/**
 * 对明文密码加盐哈希
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * 校验用户输入的密码是否正确
 * @param {string} inputPassword
 * @returns {boolean}
 */
export function verifyPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') return false;

  // 1. 优先使用环境变量 APP_PASSWORD
  const envPassword = process.env.APP_PASSWORD?.trim();
  if (envPassword) {
    return inputPassword === envPassword;
  }

  // 2. 从 SQLite 校验哈希
  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT password_hash, salt FROM auth_meta WHERE id = 1');
  const row = stmt.get();
  if (!row || !row.password_hash || !row.salt) return false;

  const computedHash = hashPassword(inputPassword, row.salt);
  return computedHash === row.password_hash;
}

/**
 * 设置或更新访问密码（写入 SQLite）
 * @param {string} newPassword
 */
export function setPassword(newPassword) {
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
    throw new Error('密码不能为空');
  }

  initAuthTable();
  const db = getSqliteDb();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword.trim(), salt);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO auth_meta (id, password_hash, salt, created_at, updated_at)
    VALUES (1, ?, ?, COALESCE((SELECT created_at FROM auth_meta WHERE id = 1), ?), ?)
  `);
  stmt.run(passwordHash, salt, now, now);

  // 清空所有历史会话，强制旧会话失效重新登录
  db.exec('DELETE FROM auth_sessions;');
}

/**
 * 创建新会话 Token
 * @param {boolean} rememberMe 是否保持登录（30天或1天）
 * @returns {{ token: string, expiresAt: string }}
 */
export function createSession(rememberMe = true) {
  initAuthTable();
  const db = getSqliteDb();
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();

  // 记住登录 30 天，否则 24 小时
  const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs).toISOString();

  const stmt = db.prepare('INSERT INTO auth_sessions (token, created_at, expires_at) VALUES (?, ?, ?)');
  stmt.run(token, now.toISOString(), expiresAt);

  return { token, expiresAt };
}

/**
 * 校验会话 Token 是否有效
 * @param {string} token
 * @returns {boolean}
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  initAuthTable();
  const db = getSqliteDb();
  const now = new Date().toISOString();

  // 查询并自动清除已过期会话
  const stmt = db.prepare('SELECT expires_at FROM auth_sessions WHERE token = ?');
  const session = stmt.get(token);

  if (!session) return false;
  if (session.expires_at < now) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return false;
  }

  return true;
}

/**
 * 撤销/删除会话 Token
 * @param {string} token
 */
export function revokeSessionToken(token) {
  if (!token) return;
  initAuthTable();
  const db = getSqliteDb();
  db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
}

/**
 * 从 Next.js Request 中校验认证状态
 * @param {Request} request
 * @returns {boolean}
 */
export function verifyRequestAuth(request) {
  // 如果系统尚未初始化密码，默认放行供初次配置
  if (!isPasswordSet()) {
    return true;
  }

  // 1. 尝试从 Authorization Header 提取 Token (Bearer <token>)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (verifySessionToken(token)) return true;
  }

  // 2. 尝试从 Cookie 中提取 Token
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/fund_auth_token=([^;]+)/);
  if (match && match[1]) {
    const cookieToken = decodeURIComponent(match[1]).trim();
    if (verifySessionToken(cookieToken)) return true;
  }

  return false;
}
