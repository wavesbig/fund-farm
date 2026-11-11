import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('d:/git_space/navdeck/node_modules/playwright');

console.log('==> 1. 启动生产服务 Next.js (port 3000)...');
const server = spawn('npm.cmd', ['run', 'start', '--', '-p', '3000'], {
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, PORT: '3000' }
});

server.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', d => process.stderr.write(`[server] ${d}`));

// 轮询检查 3000 端口可用
let ready = false;
for (let i = 0; i < 40; i++) {
  try {
    const res = await fetch('http://localhost:3000');
    if (res.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise(r => setTimeout(r, 1000));
}

if (!ready) {
  server.kill();
  console.error('服务启动超时');
  process.exit(1);
}

console.log('==> 2. 服务已就绪，启动 Chromium 进行高精度截屏...');
const browser = await chromium.launch({ headless: true });

try {
  // 1. PC 端主界面
  const pcContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const pcPage = await pcContext.newPage();
  await pcPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(3000); // 等待图表与估值计算渲染

  const pcDemo1 = resolve('doc/pc-demo-01.png');
  await pcPage.screenshot({ path: pcDemo1 });
  console.log(`✓ 已生成 PC 主界面截图: ${pcDemo1}`);

  // 2. PC 端设置弹窗
  try {
    const avatarBtn = await pcPage.$('header button:has(svg.lucide-user), header button:has(img)');
    if (avatarBtn) {
      await avatarBtn.click();
      await pcPage.waitForTimeout(500);
      const settingsItem = await pcPage.$('[role="menuitem"]:has-text("系统设置")');
      if (settingsItem) {
        await settingsItem.click();
        await pcPage.waitForTimeout(1000);
      }
    }
  } catch (err) {
    console.warn('打开系统设置失败:', err.message);
  }
  const pcDemo2 = resolve('doc/pc-demo-02.png');
  await pcPage.screenshot({ path: pcDemo2 });
  console.log(`✓ 已生成 PC 设置界面截图: ${pcDemo2}`);
  await pcContext.close();

  // 3. 移动端界面
  const mobileContext = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(3000);

  const mobileDemo = resolve('doc/mobile-demo-01.png');
  await mobilePage.screenshot({ path: mobileDemo });
  console.log(`✓ 已生成移动端适配截图: ${mobileDemo}`);
  await mobileContext.close();

} finally {
  await browser.close().catch(() => {});
  try {
    server.kill();
  } catch {}
}

console.log('==> 截屏全部顺利完成！');
process.exit(0);
