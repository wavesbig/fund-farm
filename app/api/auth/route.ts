import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isPasswordSet,
  verifyPassword,
  setPassword,
  createSession,
  verifyRequestAuth,
  revokeSessionToken
} from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: 检查当前登录状态和是否已设置密码
 */
export async function GET(request: NextRequest) {
  try {
    const initialized = isPasswordSet();
    const authenticated = !initialized || verifyRequestAuth(request);

    return NextResponse.json({
      success: true,
      isInitialized: initialized,
      isAuthenticated: authenticated
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

    // 1. 首次初始化设置密码
    if (action === 'setup') {
      if (isPasswordSet()) {
        return NextResponse.json({ success: false, error: '系统密码已设置，请直接登录' }, { status: 400 });
      }

      const password = (body.password || '').trim();
      if (!password || password.length < 4) {
        return NextResponse.json({ success: false, error: '密码长度不能少于 4 位' }, { status: 400 });
      }

      setPassword(password);
      const session = createSession(true);

      const res = NextResponse.json({
        success: true,
        message: '密码设置成功',
        token: session.token,
        expiresAt: session.expiresAt
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
      const password = (body.password || '').trim();
      if (!password) {
        return NextResponse.json({ success: false, error: '请输入访问密码' }, { status: 400 });
      }

      const isValid = verifyPassword(password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: '密码错误，请重新输入' }, { status: 401 });
      }

      const rememberMe = body.rememberMe !== false;
      const session = createSession(rememberMe);

      const res = NextResponse.json({
        success: true,
        token: session.token,
        expiresAt: session.expiresAt
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

    // 3. 修改密码
    if (action === 'change-password') {
      if (!verifyRequestAuth(request)) {
        return NextResponse.json({ success: false, error: '未授权，请先登录' }, { status: 401 });
      }

      const oldPassword = (body.oldPassword || '').trim();
      const newPassword = (body.newPassword || '').trim();

      if (!verifyPassword(oldPassword)) {
        return NextResponse.json({ success: false, error: '原密码错误' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ success: false, error: '新密码长度不能少于 4 位' }, { status: 400 });
      }

      setPassword(newPassword);
      const session = createSession(true);

      const res = NextResponse.json({
        success: true,
        message: '密码修改成功',
        token: session.token
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
