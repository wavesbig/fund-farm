import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isPasswordSet,
  verifyCredentials,
  setAccount,
  createSession,
  verifyRequestAuth,
  revokeSessionToken,
  getStoredUser
} from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: 检查当前登录状态和是否已设置账号密码
 */
export async function GET(request: NextRequest) {
  try {
    const initialized = isPasswordSet();
    // 关键修正：未初始化时必须为未登录未授权（isAuthenticated: false），绝不能直接进入首页
    const authenticated = initialized && verifyRequestAuth(request);
    const user = authenticated ? getStoredUser() : null;

    return NextResponse.json({
      success: true,
      isInitialized: initialized,
      isAuthenticated: authenticated,
      user
    });
  } catch (err: any) {
    console.error('[API /api/auth GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: 处理 setup、login、logout、change-password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'login';

    // 1. 首次初始化设置账号与密码
    if (action === 'setup') {
      if (isPasswordSet()) {
        return NextResponse.json({ success: false, error: '系统账号密码已设置，请直接登录' }, { status: 400 });
      }

      const username = (body.username || 'admin').trim();
      const password = (body.password || '').trim();

      if (!username || username.length < 2) {
        return NextResponse.json({ success: false, error: '账号名长度不能少于 2 位' }, { status: 400 });
      }

      if (!password || password.length < 4) {
        return NextResponse.json({ success: false, error: '密码长度不能少于 4 位' }, { status: 400 });
      }

      setAccount(username, password);
      const session = createSession(true);

      const res = NextResponse.json({
        success: true,
        message: '账号密码设置成功',
        token: session.token,
        expiresAt: session.expiresAt,
        user: { username }
      });

      // 写入安全 Cookie
      res.cookies.set('fund_auth_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60
      });

      return res;
    }

    // 2. 登录认证
    if (action === 'login') {
      const username = (body.username || '').trim();
      const password = (body.password || '').trim();

      if (!password) {
        return NextResponse.json({ success: false, error: '请输入访问密码' }, { status: 400 });
      }

      const isValid = verifyCredentials(username, password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: '账号或密码错误，请重新输入' }, { status: 401 });
      }

      const rememberMe = body.rememberMe !== false;
      const session = createSession(rememberMe);
      const currentUser = getStoredUser();

      const res = NextResponse.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt,
        user: currentUser || { username: username || 'admin' }
      });

      // 写入 Cookie
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      res.cookies.set('fund_auth_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge
      });

      return res;
    }

    // 3. 修改账号或密码
    if (action === 'change-password') {
      if (!verifyRequestAuth(request)) {
        return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 });
      }

      const oldPassword = (body.oldPassword || '').trim();
      const newPassword = (body.newPassword || '').trim();
      const newUsername = (body.newUsername || '').trim();

      if (!verifyCredentials(undefined, oldPassword)) {
        return NextResponse.json({ success: false, error: '原密码错误' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ success: false, error: '新密码长度不能少于 4 位' }, { status: 400 });
      }

      const currentUser = getStoredUser();
      const finalUsername = newUsername || currentUser?.username || 'admin';

      setAccount(finalUsername, newPassword);
      const session = createSession(true);

      const res = NextResponse.json({
        success: true,
        message: '账号密码修改成功',
        token: session.token,
        user: { username: finalUsername }
      });

      res.cookies.set('fund_auth_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60
      });

      return res;
    }

    // 4. 退出登录 / 锁定
    if (action === 'logout') {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
      const cookieToken = request.cookies.get('fund_auth_token')?.value;

      if (token) revokeSessionToken(token);
      if (cookieToken && cookieToken !== token) revokeSessionToken(cookieToken);

      const res = NextResponse.json({ success: true, message: '已安全退出登录' });
      res.cookies.set('fund_auth_token', '', {
        path: '/',
        maxAge: 0
      });
      return res;
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/auth POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
