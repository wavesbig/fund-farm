import crypto from 'node:crypto';
import { isString } from 'lodash';
import { getSqliteDb } from './sqliteDb';

/**
 * 初始化认证相关的 SQLite 数据表
 */
export function initAuthTable(): void {
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
 */
export function isPasswordSet(): boolean {
  // 1. 如果环境变量指定了密码，视为已设置
  if (process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim() !== '') {
    return true;
  }

  // 2. 检查 SQLite 中的记录
  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT password_hash FROM auth_meta WHERE id = 1');
  const row = stmt.get() as { password_hash?: string } | undefined;
  return Boolean(row?.password_hash);
}

/**
 * 对明文密码加盐哈希
 */
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * 校验用户输入的密码是否正确
 */
export function verifyPassword(inputPassword: unknown): boolean {
  if (!isString(inputPassword) || !inputPassword) return false;

  // 1. 优先使用环境变量 APP_PASSWORD
  const envPassword = process.env.APP_PASSWORD?.trim();
  if (envPassword) {
    const a = Buffer.from(inputPassword);
    const b = Buffer.from(envPassword);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // 2. 从 SQLite 校验哈希
  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT password_hash, salt FROM auth_meta WHERE id = 1');
  const row = stmt.get() as { password_hash?: string; salt?: string } | undefined;
  if (!row || !row.password_hash || !row.salt) return false;

  const computedHash = hashPassword(inputPassword, row.salt);
  const a = Buffer.from(computedHash);
  const b = Buffer.from(row.password_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * 设置或更新访问密码（写入 SQLite）
 */
export function setPassword(newPassword: unknown): void {
  if (!isString(newPassword) || newPassword.trim().length === 0) {
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
 * @param rememberMe 是否保持登录（30天或1天）
 */
export function createSession(rememberMe: boolean = true): { token: string; expiresAt: string } {
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
 */
export function verifySessionToken(token: unknown): boolean {
  if (!isString(token) || !token) return false;

  initAuthTable();
  const db = getSqliteDb();
  const now = new Date().toISOString();

  // 查询并自动清除已过期会话
  const stmt = db.prepare('SELECT expires_at FROM auth_sessions WHERE token = ?');
  const session = stmt.get(token) as { expires_at?: string } | undefined;

  if (!session || !session.expires_at) return false;
  const expiresAtMs = new Date(session.expires_at).getTime();
  if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return false;
  }

  return true;
}

/**
 * 撤销/删除会话 Token
 */
export function revokeSessionToken(token: unknown): void {
  if (!isString(token) || !token) return;
  initAuthTable();
  const db = getSqliteDb();
  db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
}

/**
 * 从 Next.js Request 中校验认证状态
 */
export function verifyRequestAuth(request: Request): boolean {
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
