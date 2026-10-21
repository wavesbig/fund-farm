import { NextResponse } from 'next/server';
import { getAllData, getDataByKey, setBatchData, setData, deleteKey, clearAll } from '@/app/lib/sqliteDb';
import { verifyRequestAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: 获取 SQLite 中的配置与持仓数据
 */
export async function GET(request) {
  try {
    // 权限校验：未登录拒绝返回数据
    if (!verifyRequestAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized, please unlock first' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const value = getDataByKey(key);
      return NextResponse.json({ success: true, key, value });
    }

    const { data, updatedAt } = getAllData();
    return NextResponse.json({
      success: true,
      data,
      updatedAt,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API /api/sync GET Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read SQLite' },
      { status: 500 }
    );
  }
}

/**
 * POST: 保存/增量更新数据到 SQLite
 */
export async function POST(request) {
  try {
    // 权限校验
    if (!verifyRequestAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized, please unlock first' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 格式 1: { data: { key1: val1, key2: val2, ... } }
    if (body.data && typeof body.data === 'object') {
      const result = setBatchData(body.data);
      return NextResponse.json({ success: true, ...result });
    }

    // 格式 2: { key: 'funds', value: [...] }
    if (body.key) {
      const result = setData(body.key, body.value);
      return NextResponse.json({ success: true, ...result });
    }

    // 格式 3: 顶层直接是键值对对象
    const result = setBatchData(body);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[API /api/sync POST Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save to SQLite' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 删除指定 key 或清空
 */
export async function DELETE(request) {
  try {
    if (!verifyRequestAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized, please unlock first' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.clear === true) {
      clearAll();
      return NextResponse.json({ success: true, message: 'All SQLite data cleared' });
    }

    if (body.key) {
      deleteKey(body.key);
      return NextResponse.json({ success: true, message: `Key ${body.key} deleted` });
    }

    return NextResponse.json({ success: false, error: 'Missing key or clear flag' }, { status: 400 });
  } catch (error) {
    console.error('[API /api/sync DELETE Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete from SQLite' },
      { status: 500 }
    );
  }
}
