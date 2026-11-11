import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('d:/git_space/navdeck/node_modules/playwright');

const PASSWORD = process.env.UNLOCK_PASSWORD || '';
const BASE_URL = 'http://localhost:3000';

console.log('==> 启动 Chromium 进行带密码解锁的高精度真实截屏...');
const browser = await chromium.launch({ headless: true });

async function unlockIfLocked(page) {
  try {
    const pwdInput = await page.$('input[type="password"]');
    if (pwdInput) {
      console.log('    [检测到锁屏] 正在输入密码解锁...');
      await pwdInput.fill(PASSWORD);
      await page.waitForTimeout(200);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      } else {
        await pwdInput.press('Enter');
      }
      await page.waitForSelector('input[type="password"]', { state: 'detached', timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(2500); // 等待数据与表格动效稳定
      console.log('    ✓ 解锁成功，已进入主界面');
    }
  } catch (e) {
    console.warn('    解锁处理跳过:', e.message);
  }
}

try {
  // 1. PC 桌面端主界面
  console.log('==> 1. 正在截取 PC 端主界面...');
  const pcContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const pcPage = await pcContext.newPage();
  await pcPage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await unlockIfLocked(pcPage);
  await pcPage.waitForTimeout(3000); // 等待分时图和数据加载

  const pcDemo1 = resolve('doc/pc-demo-01.png');
  await pcPage.screenshot({ path: pcDemo1 });
  console.log(`✓ 已生成真实 PC 主界面截图: ${pcDemo1}`);

  // 2. PC 端系统设置与大模型中心弹窗
  console.log('==> 2. 正在打开系统设置并截取...');
  try {
    // 触发右上角用户菜单
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
    console.warn('无法打开系统设置弹窗:', err.message);
  }
  const pcDemo2 = resolve('doc/pc-demo-02.png');
  await pcPage.screenshot({ path: pcDemo2 });
  console.log(`✓ 已生成真实 PC 设置界面截图: ${pcDemo2}`);
  await pcContext.close();

  // 3. 移动端自适应界面
  console.log('==> 3. 正在截取移动端适配界面...');
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await unlockIfLocked(mobilePage);
  await mobilePage.waitForTimeout(3000);

  const mobileDemo = resolve('doc/mobile-demo-01.png');
  await mobilePage.screenshot({ path: mobileDemo });
  console.log(`✓ 已生成真实移动端适配截图: ${mobileDemo}`);
  await mobileContext.close();

} finally {
  await browser.close().catch(() => {});
}

console.log('==> 🎉 所有真实截图均已全部生成完成！');
process.exit(0);
