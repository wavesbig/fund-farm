import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('d:/git_space/navdeck/node_modules/playwright');

const PASSWORD = process.env.UNLOCK_PASSWORD || '';
const BASE_URL = 'http://localhost:3000';

// 优质、饱满且完全脱敏的演示用理财资产看板数据
const DEMO_FUNDS = [
  {
    code: '000478',
    name: '建信中证500指数增强A',
    dwjz: '2.9863',
    gsz: 3.0135,
    gszzl: 0.91,
    jzrq: '2026-11-10',
    gztime: '2026-11-11 15:00',
    yesterdayZzl: 0.85,
    addedAt: 1794278663522,
    dataSource: 1,
    valuationSource: 'fundgz'
  },
  {
    code: '012319',
    name: '摩根纳斯达克100指数(QDII)A',
    dwjz: '1.2005',
    gsz: 1.2185,
    gszzl: 1.5,
    jzrq: '2026-11-10',
    gztime: '2026-11-11 15:00',
    yesterdayZzl: 1.12,
    addedAt: 1794278663523,
    dataSource: 1,
    valuationSource: 'fundgz'
  },
  {
    code: '020483',
    name: '广发恒生科技ETF联接A',
    dwjz: '2.3252',
    gsz: 2.3485,
    gszzl: 1.0,
    jzrq: '2026-11-10',
    gztime: '2026-11-11 15:00',
    yesterdayZzl: 0.95,
    addedAt: 1794278663525,
    dataSource: 1,
    valuationSource: 'fundgz'
  },
  {
    code: '002671',
    name: '万家成长优选混合A',
    dwjz: '1.6931',
    gsz: 1.6842,
    gszzl: -0.53,
    jzrq: '2026-11-10',
    gztime: '2026-11-11 15:00',
    yesterdayZzl: -0.32,
    addedAt: 1794278663524,
    dataSource: 1,
    valuationSource: 'fundgz'
  },
  {
    code: '110022',
    name: '易方达消费行业股票',
    dwjz: '3.6520',
    gsz: 3.6739,
    gszzl: 0.6,
    jzrq: '2026-11-10',
    gztime: '2026-11-11 15:00',
    yesterdayZzl: -0.25,
    addedAt: 1794278663526,
    dataSource: 1,
    valuationSource: 'fundgz'
  }
];

const DEMO_HOLDINGS = {
  '000478': { share: 2000, cost: 2.92 },
  '012319': { share: 3000, cost: 1.15 },
  '020483': { share: 2500, cost: 2.25 },
  '002671': { share: 1500, cost: 1.72 },
  110022: { share: 1000, cost: 3.58 }
};

const DEMO_GROUPS = [
  { id: 'fav', name: '自选精选', codes: ['000478', '012319', '110022'], isPreset: true },
  { id: 'grp_tech', name: '科技与全球', codes: ['012319', '020483'] },
  { id: 'grp_core', name: '核心主赛道', codes: ['000478', '110022'] }
];

console.log('==> 1. 确保本地服务 (Next.js) 启动...');
let server = null;
let serverAlreadyRunning = false;
try {
  const chk = await fetch(BASE_URL);
  if (chk.ok) serverAlreadyRunning = true;
} catch {}

if (!serverAlreadyRunning) {
  server = spawn('npm.cmd', ['run', 'start', '--', '-p', '3000'], {
    stdio: 'ignore',
    shell: true,
    env: { ...process.env, PORT: '3000' }
  });
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log('==> 2. 获取认证 Token...');
let authCookie = null;
try {
  const loginRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', password: PASSWORD, rememberMe: true })
  });
  const data = await loginRes.json();
  if (data?.token) {
    authCookie = {
      name: 'fund_farm_auth_session',
      value: data.token,
      domain: 'localhost',
      path: '/'
    };
  }
} catch (e) {
  console.warn('登录 API 预请求失败:', e.message);
}

console.log('==> 3. 启动 Chromium 渲染脱敏高颜值看板...');
const browser = await chromium.launch({ headless: true });

async function setupContextAndPage(viewport, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile
  });
  if (authCookie) {
    await context.addCookies([authCookie]);
  }

  const page = await context.newPage();

  // 注入非敏感但丰富美观的示例资产数据
  await page.addInitScript(
    ({ funds, holdings, groups }) => {
      window.localStorage.setItem('funds', JSON.stringify(funds));
      window.localStorage.setItem('holdings', JSON.stringify(holdings));
      window.localStorage.setItem('groups', JSON.stringify(groups));
      window.localStorage.setItem('favorites', JSON.stringify(['000478', '012319', '110022']));
      window.localStorage.setItem(
        'customSettings',
        JSON.stringify({
          showHoldingsInCard: true,
          showCost: true
        })
      );
    },
    { funds: DEMO_FUNDS, holdings: DEMO_HOLDINGS, groups: DEMO_GROUPS }
  );

  return { context, page };
}

try {
  // 1. PC 桌面端主界面截图
  console.log('    -> 渲染 PC 端主全景看板...');
  const { context: pcCtx, page: pcPage } = await setupContextAndPage({ width: 1440, height: 900 });
  await pcPage.goto(BASE_URL, { waitUntil: 'networkidle' });

  // 如仍有锁屏，自动输入密码解锁
  const pwdInput = await pcPage.$('input[type="password"]');
  if (pwdInput) {
    await pwdInput.fill(PASSWORD);
    const submitBtn = await pcPage.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await pcPage.waitForSelector('input[type="password"]', { state: 'detached', timeout: 5000 }).catch(() => {});
  }
  await pcPage.waitForTimeout(3500); // 等待实时估值计算与表格动效

  const pcDemo1 = resolve('doc/pc-demo-01.png');
  await pcPage.screenshot({ path: pcDemo1 });
  console.log(`    ✓ PC 主界面截图已就绪: ${pcDemo1}`);

  // 2. PC 端系统设置与大模型中心截图
  console.log('    -> 打开系统设置面板...');
  try {
    const userBtn = await pcPage.$('header button:has(svg.lucide-user), header button:has(img)');
    if (userBtn) {
      await userBtn.click();
      await pcPage.waitForTimeout(400);
      const settingsMenuItem = await pcPage.$('[role="menuitem"]:has-text("系统设置")');
      if (settingsMenuItem) {
        await settingsMenuItem.click();
        await pcPage.waitForTimeout(1200);
      }
    }
  } catch (err) {
    console.warn('    打开系统设置跳过:', err.message);
  }
  const pcDemo2 = resolve('doc/pc-demo-02.png');
  await pcPage.screenshot({ path: pcDemo2 });
  console.log(`    ✓ PC 设置界面截图已就绪: ${pcDemo2}`);
  await pcCtx.close();

  // 3. 移动端流式卡片截图
  console.log('    -> 渲染移动端流式触控卡片...');
  const { context: mobCtx, page: mobPage } = await setupContextAndPage({ width: 393, height: 852 }, true);
  await mobPage.goto(BASE_URL, { waitUntil: 'networkidle' });

  const mobPwdInput = await mobPage.$('input[type="password"]');
  if (mobPwdInput) {
    await mobPwdInput.fill(PASSWORD);
    const submitBtn = await mobPage.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await mobPage.waitForSelector('input[type="password"]', { state: 'detached', timeout: 5000 }).catch(() => {});
  }
  await mobPage.waitForTimeout(3500);

  const mobDemo = resolve('doc/mobile-demo-01.png');
  await mobPage.screenshot({ path: mobDemo });
  console.log(`    ✓ 移动端适配截图已就绪: ${mobDemo}`);
  await mobCtx.close();
} finally {
  await browser.close().catch(() => {});
  if (server) {
    server.kill();
  }
}

console.log('==> 🎉 包含丰富不敏感数据的精美截图全部更新完毕！');
process.exit(0);
