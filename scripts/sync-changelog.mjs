import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const changelogPath = path.join(rootDir, 'CHANGELOG.md');
const changelogDataPath = path.join(rootDir, 'app', 'lib', 'changelogData.ts');

if (!fs.existsSync(changelogPath) || !fs.existsSync(changelogDataPath)) {
  console.error('CHANGELOG.md 或 changelogData.ts 不存在');
  process.exit(1);
}

const changelogContent = fs.readFileSync(changelogPath, 'utf8');

function parseChangeLine(line, fallbackId) {
  const clean = line.replace(/^[-*•]\s*/, '').trim();
  if (!clean || clean.startsWith('#') || clean === '变更') return null;

  const match = clean.match(/^(feat|fix|perf|style|refactor|docs|chore|ci)(?:\(([^)]+)\))?:\s*(.*)$/i);
  if (match) {
    const rawType = match[1].toLowerCase();
    const scope = match[2]?.trim();
    const description = match[3]?.trim() || clean;
    return {
      id: fallbackId,
      type: rawType,
      scope: scope || undefined,
      description,
      raw: clean
    };
  }

  let guessedType = 'other';
  if (/^新增|支持|引入/i.test(clean)) guessedType = 'feat';
  else if (/^修复|解决/i.test(clean)) guessedType = 'fix';
  else if (/^优化|性能|提速/i.test(clean)) guessedType = 'perf';
  else if (/^样式|视觉|UI|排版/i.test(clean)) guessedType = 'style';
  else if (/^重构|规范/i.test(clean)) guessedType = 'refactor';
  else if (/^文档|README/i.test(clean)) guessedType = 'docs';

  return {
    id: fallbackId,
    type: guessedType,
    description: clean,
    raw: clean
  };
}

const lines = changelogContent.split(/\r?\n/);
const releases = [];
let currentRelease = null;
let itemIdx = 0;

for (const line of lines) {
  const headerMatch = line.match(/^##\s+(v?\d+\.\d+\.\d+)(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
  if (headerMatch) {
    if (currentRelease && currentRelease.items.length > 0) {
      releases.push(currentRelease);
    }
    const rawTag = headerMatch[1];
    const tagName = rawTag.startsWith('v') ? rawTag : `v${rawTag}`;
    const version = tagName.replace(/^v/, '');
    const publishedAt = headerMatch[2] || new Date().toISOString().slice(0, 10);

    currentRelease = {
      id: tagName,
      tagName,
      version,
      title: `${tagName} 版本更新`,
      publishedAt,
      htmlUrl: `https://github.com/wavesbig/fund-farm/releases/tag/${tagName}`,
      items: []
    };
    itemIdx = 0;
    continue;
  }

  if (currentRelease && /^[-*•]\s+/.test(line.trim())) {
    const item = parseChangeLine(line, `${currentRelease.tagName}-${itemIdx}`);
    if (item) {
      currentRelease.items.push(item);
      itemIdx++;
    }
  }
}

if (currentRelease && currentRelease.items.length > 0) {
  releases.push(currentRelease);
}

const formattedReleases = JSON.stringify(releases, null, 2);

let tsContent = fs.readFileSync(changelogDataPath, 'utf8');
const regex = /export const BUILTIN_RELEASES: ReleaseLog\[\] = \[[\s\S]*?\];/;

if (!regex.test(tsContent)) {
  console.error('未在 changelogData.ts 中找到 BUILTIN_RELEASES 定义');
  process.exit(1);
}

tsContent = tsContent.replace(regex, `export const BUILTIN_RELEASES: ReleaseLog[] = ${formattedReleases};`);

const prettierConfig = (await prettier.resolveConfig(changelogDataPath)) || {};
const formattedTs = await prettier.format(tsContent, {
  ...prettierConfig,
  parser: 'typescript'
});

fs.writeFileSync(changelogDataPath, formattedTs, 'utf8');
console.log(`已成功同步 ${releases.length} 个版本日志至 app/lib/changelogData.ts`);
