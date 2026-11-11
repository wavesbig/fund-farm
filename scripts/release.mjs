import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// 优先检测 Git for Windows 自带的 bash，防止在 Windows PowerShell 下误触发 WSL 的 bash
const gitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
const sh = existsSync(gitBash) ? gitBash : 'bash';
const args = ['scripts/release.sh', ...process.argv.slice(2)];

const result = spawnSync(sh, args, { stdio: 'inherit' });
process.exit(result.status ?? 0);
