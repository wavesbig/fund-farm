import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// 优先检测 Git for Windows 自带的 bash，防止在 Windows PowerShell 下误触发 WSL 的 bash
const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
const sh = existsSync(gitBash) ? gitBash : 'bash';
const args = ['scripts/release.sh', ...process.argv.slice(2)];

const env = { ...process.env };
if (!env.GITHUB_TOKEN) {
  try {
    const credProc = spawnSync('docker-credential-desktop.exe', ['get'], {
      input: 'ghcr.io\n',
      encoding: 'utf-8',
      shell: true,
    });
    if (credProc.stdout) {
      const parsed = JSON.parse(credProc.stdout);
      if (parsed.Secret) {
        env.GITHUB_TOKEN = parsed.Secret;
      }
    }
  } catch {}
}

const result = spawnSync(sh, args, { stdio: 'inherit', env });
process.exit(result.status ?? 0);
