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
      username TEXT,
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

  // 检查是否已有 auth_meta 表但缺少 username 字段（支持老版本平滑迁移）
  try {
    const tableInfo = db.prepare('PRAGMA table_info(auth_meta)').all() as Array<{ name: string }>;
    const hasUsername = tableInfo.some((col) => col.name === 'username');
    if (!hasUsername) {
      db.exec('ALTER TABLE auth_meta ADD COLUMN username TEXT;');
    }
  } catch {
    // 忽略特定环境下 PRAGMA 异常
  }
}

/**
 * 获取环境变量中配置的默认账号与密码
 */
export function getEnvCredentials(): { username: string; password?: string } {
  const rawUser = process.env.APP_USERNAME || process.env.ADMIN_USERNAME;
  const rawPass = process.env.APP_PASSWORD || process.env.ADMIN_PASSWORD;

  const username = isString(rawUser) && rawUser.trim() ? rawUser.trim() : 'admin';
  const password = isString(rawPass) && rawPass.trim() ? rawPass.trim() : undefined;

  return { username, password };
}

/**
 * 检查当前系统是否已设置访问账号密码
 */
export function isPasswordSet(): boolean {
  // 1. 如果环境变量指定了密码，视为已设置
  const envCreds = getEnvCredentials();
  if (envCreds.password) {
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
 * 获取当前系统配置的用户名（供前端展示）
 */
export function getStoredUser(): { username: string } | null {
  const envCreds = getEnvCredentials();
  if (envCreds.password) {
    return { username: envCreds.username };
  }

  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT username, password_hash FROM auth_meta WHERE id = 1');
  const row = stmt.get() as { username?: string; password_hash?: string } | undefined;
  if (!row || !row.password_hash) return null;
  return { username: row.username || 'admin' };
}

/**
 * 对明文密码加盐哈希
 */
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * 校验用户输入的账号与密码是否正确
 */
export function verifyCredentials(inputUsername: unknown, inputPassword: unknown): boolean {
  if (!isString(inputPassword) || !inputPassword) return false;
  const inputPassTrim = inputPassword.trim();
  const inputUserTrim = isString(inputUsername) ? inputUsername.trim() : '';

  // 1. 优先使用环境变量 APP_PASSWORD / ADMIN_PASSWORD
  const envCreds = getEnvCredentials();
  if (envCreds.password) {
    const expectedUsername = envCreds.username || 'admin';
    // 若输入了用户名，则严格或不区分大小写匹配；若未输入（兼容老客户端），则允许通过
    if (inputUserTrim && inputUserTrim.toLowerCase() !== expectedUsername.toLowerCase()) {
      return false;
    }

    const a = Buffer.from(inputPassTrim);
    const b = Buffer.from(envCreds.password);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // 2. 从 SQLite 校验哈希与用户名
  initAuthTable();
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT username, password_hash, salt FROM auth_meta WHERE id = 1');
  const row = stmt.get() as { username?: string; password_hash?: string; salt?: string } | undefined;
  if (!row || !row.password_hash || !row.salt) return false;

  const expectedUsername = row.username || 'admin';
  if (inputUserTrim && inputUserTrim.toLowerCase() !== expectedUsername.toLowerCase()) {
    return false;
  }

  const computedHash = hashPassword(inputPassTrim, row.salt);
  const a = Buffer.from(computedHash);
  const b = Buffer.from(row.password_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * 校验用户输入的密码是否正确（向下兼容旧调用）
 */
export function verifyPassword(inputPassword: unknown): boolean {
  return verifyCredentials(undefined, inputPassword);
}

/**
 * 设置或更新账号与密码（写入 SQLite）
 */
export function setAccount(newUsername: unknown, newPassword: unknown): void {
  if (!isString(newPassword) || newPassword.trim().length === 0) {
    throw new Error('密码不能为空');
  }
  const cleanUsername = isString(newUsername) && newUsername.trim() ? newUsername.trim() : 'admin';

  initAuthTable();
  const db = getSqliteDb();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(newPassword.trim(), salt);
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO auth_meta (id, username, password_hash, salt, created_at, updated_at)
    VALUES (1, ?, ?, ?, COALESCE((SELECT created_at FROM auth_meta WHERE id = 1), ?), ?)
  `);
  stmt.run(cleanUsername, passwordHash, salt, now, now);

  // 清空所有历史会话，强制旧会话失效重新登录
  db.exec('DELETE FROM auth_sessions;');
}

/**
 * 设置或更新访问密码（向下兼容旧调用）
 */
export function setPassword(newPassword: unknown): void {
  setAccount('admin', newPassword);
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
  // 如果系统尚未初始化密码，绝不能放行数据访问！必须在前端完成初始化设置并登录
  if (!isPasswordSet()) {
    return false;
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
