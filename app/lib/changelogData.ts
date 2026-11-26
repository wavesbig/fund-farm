// 养基场历史版本更新日志数据（内置兜底与极速渲染）
import { isArray, isString, isEmpty, isObject } from 'lodash';

export type ChangeType = 'feat' | 'fix' | 'perf' | 'style' | 'refactor' | 'docs' | 'chore' | 'ci' | 'other';

export interface ChangeItem {
  id: string;
  type: ChangeType;
  scope?: string;
  description: string;
  raw: string;
}

export interface ReleaseLog {
  id: string;
  tagName: string;
  version: string;
  title?: string;
  publishedAt: string;
  items: ChangeItem[];
  htmlUrl?: string;
}

export const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  feat: {
    label: '特性',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/25'
  },
  fix: {
    label: '修复',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    textClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500/25'
  },
  perf: {
    label: '性能',
    bgClass: 'bg-violet-500/10 dark:bg-violet-500/15',
    textClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'border-violet-500/25'
  },
  style: {
    label: '界面',
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/15',
    textClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-500/25'
  },
  refactor: {
    label: '重构',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    borderClass: 'border-indigo-500/25'
  },
  docs: {
    label: '文档',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/25'
  },
  chore: {
    label: '工程',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/15',
    textClass: 'text-slate-600 dark:text-slate-400',
    borderClass: 'border-slate-500/25'
  },
  ci: {
    label: '构建',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/25'
  },
  other: {
    label: '更新',
    bgClass: 'bg-zinc-500/10 dark:bg-zinc-500/15',
    textClass: 'text-zinc-600 dark:text-zinc-400',
    borderClass: 'border-zinc-500/25'
  }
};

export const BUILTIN_RELEASES: ReleaseLog[] = [
  {
    id: 'v1.0.13',
    tagName: 'v1.0.13',
    version: '1.0.13',
    title: 'v1.0.13 版本更新',
    publishedAt: '2026-11-26',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.13',
    items: [
      {
        id: 'v1.0.13-0',
        type: 'fix',
        scope: 'changelog',
        description: '移除全局modal类名与宽度锁死限制，真加宽至820px并精简日志排版',
        raw: 'fix(changelog): 移除全局modal类名与宽度锁死限制，真加宽至820px并精简日志排版'
      },
      {
        id: 'v1.0.13-1',
        type: 'style',
        scope: 'changelog',
        description: '进一步加宽更新日志弹框宽度至 800px',
        raw: 'style(changelog): 进一步加宽更新日志弹框宽度至 800px'
      },
      {
        id: 'v1.0.13-2',
        type: 'style',
        scope: 'changelog',
        description: '适度加宽更新日志弹框尺寸至 640px',
        raw: 'style(changelog): 适度加宽更新日志弹框尺寸至 640px'
      },
      {
        id: 'v1.0.13-3',
        type: 'refactor',
        scope: 'guide',
        description: '将 Star 引导优化为右下角轻量悬浮卡片，移除全屏遮罩',
        raw: 'refactor(guide): 将 Star 引导优化为右下角轻量悬浮卡片，移除全屏遮罩'
      },
      {
        id: 'v1.0.13-4',
        type: 'feat',
        scope: 'guide',
        description: '新增首页初次访问 GitHub Star 引导弹窗',
        raw: 'feat(guide): 新增首页初次访问 GitHub Star 引导弹窗'
      },
      {
        id: 'v1.0.13-5',
        type: 'refactor',
        scope: 'ui',
        description: '统一更新日志弹窗规范，精简边距与头部层次',
        raw: 'refactor(ui): 统一更新日志弹窗规范，精简边距与头部层次'
      },
      {
        id: 'v1.0.13-6',
        type: 'refactor',
        scope: 'changelog',
        description: '精简更新日志弹窗内边距与卡片排版',
        raw: 'refactor(changelog): 精简更新日志弹窗内边距与卡片排版'
      },
      {
        id: 'v1.0.13-7',
        type: 'refactor',
        scope: 'ui',
        description: '全面精简Star入口与底栏排版，移除冗余堆砌并修复语雀失效外链',
        raw: 'refactor(ui): 全面精简Star入口与底栏排版，移除冗余堆砌并修复语雀失效外链'
      },
      {
        id: 'v1.0.13-8',
        type: 'feat',
        scope: 'branding',
        description: '全站合理增设 GitHub Star 入口并优化顶栏、菜单与底栏交互',
        raw: 'feat(branding): 全站合理增设 GitHub Star 入口并优化顶栏、菜单与底栏交互'
      }
    ]
  },
  {
    id: 'v1.0.12',
    tagName: 'v1.0.12',
    version: '1.0.12',
    title: 'v1.0.12 版本更新',
    publishedAt: '2026-11-25',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.12',
    items: [
      {
        id: 'v1.0.12-0',
        type: 'fix',
        scope: 'changelog',
        description: '移除更新日志弹窗多余完成按钮并自动同步最新版本日志',
        raw: 'fix(changelog): 移除更新日志弹窗多余完成按钮并自动同步最新版本日志'
      }
    ]
  },
  {
    id: 'v1.0.11',
    tagName: 'v1.0.11',
    version: '1.0.11',
    title: 'v1.0.11 版本更新',
    publishedAt: '2026-11-25',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.11',
    items: [
      {
        id: 'v1.0.11-0',
        type: 'perf',
        scope: 'ui',
        description: '优化卡片与表格视图切换响应及离屏渲染性能',
        raw: 'perf(ui): 优化卡片与表格视图切换响应及离屏渲染性能'
      },
      {
        id: 'v1.0.11-1',
        type: 'fix',
        scope: 'ui',
        description: '修复无障碍可访问性、暗色主色对比度、Safari防缩放及滚动卡顿问题',
        raw: 'fix(ui): 修复无障碍可访问性、暗色主色对比度、Safari防缩放及滚动卡顿问题'
      },
      {
        id: 'v1.0.11-2',
        type: 'feat',
        scope: 'ui',
        description: '移动端操作栏与导航优化、Safari防缩放及错误处理增强',
        raw: 'feat(ui): 移动端操作栏与导航优化、Safari防缩放及错误处理增强'
      },
      {
        id: 'v1.0.11-3',
        type: 'fix',
        scope: 'ui',
        description: '修复操作菜单与弹窗焦点冲突、消除滚动条跳动并重构分红方式等弹窗布局',
        raw: 'fix(ui): 修复操作菜单与弹窗焦点冲突、消除滚动条跳动并重构分红方式等弹窗布局'
      },
      {
        id: 'v1.0.11-4',
        type: 'docs',
        description: '增加 LINUX DO 社区致谢与认可徽标',
        raw: 'docs: 增加 LINUX DO 社区致谢与认可徽标'
      }
    ]
  },
  {
    id: 'v1.0.10',
    tagName: 'v1.0.10',
    version: '1.0.10',
    title: 'v1.0.10 版本更新',
    publishedAt: '2026-11-22',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.10',
    items: [
      {
        id: 'v1.0.10-0',
        type: 'feat',
        scope: 'ui',
        description: '升级搜索栏交互与全局截图粘贴识图，重构各处引导按钮',
        raw: 'feat(ui): 升级搜索栏交互与全局截图粘贴识图，重构各处引导按钮'
      },
      {
        id: 'v1.0.10-1',
        type: 'feat',
        scope: 'changelog',
        description: '全面重构更新日志弹窗并接入结构化版本历史与多维筛选',
        raw: 'feat(changelog): 全面重构更新日志弹窗并接入结构化版本历史与多维筛选'
      }
    ]
  },
  {
    id: 'v1.0.9',
    tagName: 'v1.0.9',
    version: '1.0.9',
    title: 'v1.0.9 版本更新',
    publishedAt: '2026-11-20',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.9',
    items: [
      {
        id: 'v1.0.9-0',
        type: 'fix',
        scope: 'scan',
        description: '深度优化截图识别与 AI 配置弹框 UI 交互体验',
        raw: 'fix(scan): 深度优化截图识别与 AI 配置弹框 UI 交互体验'
      }
    ]
  },
  {
    id: 'v1.0.8',
    tagName: 'v1.0.8',
    version: '1.0.8',
    title: 'v1.0.8 版本更新',
    publishedAt: '2026-11-20',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.8',
    items: [
      {
        id: 'v1.0.8-0',
        type: 'fix',
        scope: 'scan',
        description: '修复本地 OCR 汉字字间空格与千分位双点截断导致的份额成本丢失问题',
        raw: 'fix(scan): 修复本地 OCR 汉字字间空格与千分位双点截断导致的份额成本丢失问题'
      }
    ]
  },
  {
    id: 'v1.0.7',
    tagName: 'v1.0.7',
    version: '1.0.7',
    title: 'v1.0.7 版本更新',
    publishedAt: '2026-11-20',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.7',
    items: [
      {
        id: 'v1.0.7-0',
        type: 'feat',
        scope: 'scan',
        description: '支持 AI 视觉直读持仓截图及成本份额提取与三级降级机制',
        raw: 'feat(scan): 支持 AI 视觉直读持仓截图及成本份额提取与三级降级机制'
      }
    ]
  },
  {
    id: 'v1.0.6',
    tagName: 'v1.0.6',
    version: '1.0.6',
    title: 'v1.0.6 版本更新',
    publishedAt: '2026-11-19',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.6',
    items: [
      {
        id: 'v1.0.6-0',
        type: 'fix',
        scope: 'table',
        description: '修复小屏/分屏下全局 CSS 导致表格列错位及金额截断问题',
        raw: 'fix(table): 修复小屏/分屏下全局 CSS 导致表格列错位及金额截断问题'
      }
    ]
  },
  {
    id: 'v1.0.5',
    tagName: 'v1.0.5',
    version: '1.0.5',
    title: 'v1.0.5 版本更新',
    publishedAt: '2026-11-19',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.5',
    items: [
      {
        id: 'v1.0.5-0',
        type: 'fix',
        description: '优化未输入基金代码提示体验及 Toast 遮挡问题',
        raw: 'fix: 优化未输入基金代码提示体验及 Toast 遮挡问题'
      },
      {
        id: 'v1.0.5-1',
        type: 'fix',
        scope: 'scan',
        description: 'resolve overlap between AI config button and dialog close button',
        raw: 'fix(scan): resolve overlap between AI config button and dialog close button'
      },
      {
        id: 'v1.0.5-2',
        type: 'ci',
        scope: 'docker',
        description: 'add opencontainers source label to link package to repository',
        raw: 'ci(docker): add opencontainers source label to link package to repository'
      }
    ]
  },
  {
    id: 'v1.0.4',
    tagName: 'v1.0.4',
    version: '1.0.4',
    title: 'v1.0.4 版本更新',
    publishedAt: '2026-11-18',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.4',
    items: [
      {
        id: 'v1.0.4-0',
        type: 'fix',
        scope: 'docker',
        description: 'add fallback for npm install during multiarch build',
        raw: 'fix(docker): add fallback for npm install during multiarch build'
      },
      {
        id: 'v1.0.4-1',
        type: 'refactor',
        scope: 'layout',
        description: 'adopt shadcn sticky header standard and eliminate navbar height hacks',
        raw: 'refactor(layout): adopt shadcn sticky header standard and eliminate navbar height hacks'
      }
    ]
  },
  {
    id: 'v1.0.3',
    tagName: 'v1.0.3',
    version: '1.0.3',
    title: 'v1.0.3 版本更新',
    publishedAt: '2026-11-18',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.3',
    items: [
      {
        id: 'v1.0.3-0',
        type: 'feat',
        scope: 'auth',
        description: 'fix initial setup guard and support docker default credentials',
        raw: 'feat(auth): fix initial setup guard and support docker default credentials'
      }
    ]
  },
  {
    id: 'v1.0.2',
    tagName: 'v1.0.2',
    version: '1.0.2',
    title: 'v1.0.2 版本更新',
    publishedAt: '2026-11-11',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.2',
    items: [
      {
        id: 'v1.0.2-0',
        type: 'chore',
        description: '规范化脚本代码风格与 eslint prettier 格式',
        raw: 'chore: 规范化脚本代码风格与 eslint prettier 格式'
      },
      {
        id: 'v1.0.2-1',
        type: 'style',
        scope: 'mobile',
        description: '深度打磨小屏可读性与响应式排版，根除列头折行与顶栏挤压问题',
        raw: 'style(mobile): 深度打磨小屏可读性与响应式排版，根除列头折行与顶栏挤压问题'
      },
      {
        id: 'v1.0.2-2',
        type: 'docs',
        description: '更新饱满高颜值且完全脱敏的实机资产看板截图',
        raw: 'docs: 更新饱满高颜值且完全脱敏的实机资产看板截图'
      },
      {
        id: 'v1.0.2-3',
        type: 'docs',
        description: '更新解锁后的真实系统界面预览截图并脱敏截图脚本',
        raw: 'docs: 更新解锁后的真实系统界面预览截图并脱敏截图脚本'
      },
      {
        id: 'v1.0.2-4',
        type: 'docs',
        description: '全面重构 README，接入新版 3D Logo 与最新高清界面实机截图',
        raw: 'docs: 全面重构 README，接入新版 3D Logo 与最新高清界面实机截图'
      },
      {
        id: 'v1.0.2-5',
        type: 'chore',
        scope: 'release',
        description: '优化发布脚本凭据传递与跨平台兼容性',
        raw: 'chore(release): 优化发布脚本凭据传递与跨平台兼容性'
      }
    ]
  },
  {
    id: 'v1.0.1',
    tagName: 'v1.0.1',
    version: '1.0.1',
    title: 'v1.0.1 版本更新',
    publishedAt: '2026-11-11',
    htmlUrl: 'https://github.com/wavesbig/fund-farm/releases/tag/v1.0.1',
    items: [
      {
        id: 'v1.0.1-0',
        type: 'chore',
        scope: 'release',
        description: '增加 release.mjs 启动器适配 Windows Git Bash',
        raw: 'chore(release): 增加 release.mjs 启动器适配 Windows Git Bash'
      },
      {
        id: 'v1.0.1-1',
        type: 'chore',
        scope: 'release',
        description: '优化 Windows 下 Docker 凭据自动提取逻辑',
        raw: 'chore(release): 优化 Windows 下 Docker 凭据自动提取逻辑'
      },
      {
        id: 'v1.0.1-2',
        type: 'chore',
        description: '引入自动化发版脚本与生产 compose 配置',
        raw: 'chore: 引入自动化发版脚本与生产 compose 配置'
      },
      {
        id: 'v1.0.1-3',
        type: 'style',
        scope: 'ui',
        description: '全局图标打磨、布局对齐优化与 shadcn UI 标准化收敛',
        raw: 'style(ui): 全局图标打磨、布局对齐优化与 shadcn UI 标准化收敛'
      },
      {
        id: 'v1.0.1-4',
        type: 'feat',
        scope: 'table',
        description: '基于 shadcn/ui 重构 PC 基金表格并彻底修复多列换行与透光穿透问题',
        raw: 'feat(table): 基于 shadcn/ui 重构 PC 基金表格并彻底修复多列换行与透光穿透问题'
      },
      {
        id: 'v1.0.1-5',
        type: 'fix',
        scope: 'scan',
        description: '修复识图导入弹框排版错乱并极大精简弹窗交互链路',
        raw: 'fix(scan): 修复识图导入弹框排版错乱并极大精简弹窗交互链路'
      },
      {
        id: 'v1.0.1-6',
        type: 'fix',
        scope: 'sync',
        description: '彻底修复 SQLite 初始化在组件重渲染时重复触发覆盖本地数据的致命缺陷',
        raw: 'fix(sync): 彻底修复 SQLite 初始化在组件重渲染时重复触发覆盖本地数据的致命缺陷'
      },
      {
        id: 'v1.0.1-7',
        type: 'style',
        scope: 'ui',
        description: '移除 Logo 冗余保存状态浮层文案',
        raw: 'style(ui): 移除 Logo 冗余保存状态浮层文案'
      },
      {
        id: 'v1.0.1-8',
        type: 'fix',
        description: '修复全量审查中的安全漏洞、并发同步与计算逻辑缺陷',
        raw: 'fix: 修复全量审查中的安全漏洞、并发同步与计算逻辑缺陷'
      },
      {
        id: 'v1.0.1-9',
        type: 'feat',
        scope: 'branding',
        description: '项目名变更为 fund-farm，底栏及反馈入口全面接入 GitHub Issues',
        raw: 'feat(branding): 项目名变更为 fund-farm，底栏及反馈入口全面接入 GitHub Issues'
      },
      {
        id: 'v1.0.1-10',
        type: 'style',
        scope: 'branding',
        description: '升级养基场超高清矢量吉祥物与纯矢量顶栏图标，解决小尺寸模糊问题',
        raw: 'style(branding): 升级养基场超高清矢量吉祥物与纯矢量顶栏图标，解决小尺寸模糊问题'
      },
      {
        id: 'v1.0.1-11',
        type: 'style',
        scope: 'branding',
        description: '接入全新 3D 拟态「小金鸡」吉祥物 App Icon',
        raw: 'style(branding): 接入全新 3D 拟态「小金鸡」吉祥物 App Icon'
      },
      {
        id: 'v1.0.1-12',
        type: 'style',
        scope: 'branding',
        description: '落地「养基场」全新视觉 Logo（金鸡破晓 · 步步高升）',
        raw: 'style(branding): 落地「养基场」全新视觉 Logo（金鸡破晓 · 步步高升）'
      },
      {
        id: 'v1.0.1-13',
        type: 'chore',
        scope: 'branding',
        description: '全面更名为「养基场」(FundFarm)',
        raw: 'chore(branding): 全面更名为「养基场」(FundFarm)'
      },
      {
        id: 'v1.0.1-14',
        type: 'feat',
        description: '内置基金关联板块与基准指数行情支持，清理历史遗留依赖与部署配置',
        raw: 'feat: 内置基金关联板块与基准指数行情支持，清理历史遗留依赖与部署配置'
      },
      {
        id: 'v1.0.1-15',
        type: 'refactor',
        description: '重构顶部 Header 与操作交互，规范 AI 弹窗布局并修复全站排版闪烁',
        raw: 'refactor: 重构顶部 Header 与操作交互，规范 AI 弹窗布局并修复全站排版闪烁'
      },
      {
        id: 'v1.0.1-16',
        type: 'feat',
        description: '全面优化 Better-UI 规范与修复嵌套按钮 Hydration 异常',
        raw: 'feat: 全面优化 Better-UI 规范与修复嵌套按钮 Hydration 异常'
      },
      {
        id: 'v1.0.1-17',
        type: 'refactor',
        description: '彻底拔除 Supabase 依赖并清理部署残留与冗余技能配置',
        raw: 'refactor: 彻底拔除 Supabase 依赖并清理部署残留与冗余技能配置'
      },
      {
        id: 'v1.0.1-18',
        type: 'fix',
        scope: 'tutorial',
        description: '修复 PC 端使用帮助弹窗排版错乱与 12 列栅格冲突',
        raw: 'fix(tutorial): 修复 PC 端使用帮助弹窗排版错乱与 12 列栅格冲突'
      },
      {
        id: 'v1.0.1-19',
        type: 'chore',
        description: '移除原作者个人信息与收款群码，重构内置帮助并规范致谢章节',
        raw: 'chore: 移除原作者个人信息与收款群码，重构内置帮助并规范致谢章节'
      },
      {
        id: 'v1.0.1-20',
        type: 'refactor',
        scope: 'sync',
        description: '改造为实时自动保存至 SQLite 并清理遗留的手动同步入口',
        raw: 'refactor(sync): 改造为实时自动保存至 SQLite 并清理遗留的手动同步入口'
      },
      {
        id: 'v1.0.1-21',
        type: 'refactor',
        scope: 'types',
        description: '全面完成应用层与配置文件的 TypeScript 迁移',
        raw: 'refactor(types): 全面完成应用层与配置文件的 TypeScript 迁移'
      },
      {
        id: 'v1.0.1-22',
        type: 'refactor',
        scope: 'auth',
        description: '彻底移除 Supabase 依赖并重构用户菜单与同步体验',
        raw: 'refactor(auth): 彻底移除 Supabase 依赖并重构用户菜单与同步体验'
      },
      {
        id: 'v1.0.1-23',
        type: 'fix',
        scope: 'FilterBar',
        description: '修复排序规则文本展示为空及视图切换与排序栏自适应布局问题',
        raw: 'fix(FilterBar): 修复排序规则文本展示为空及视图切换与排序栏自适应布局问题'
      },
      {
        id: 'v1.0.1-24',
        type: 'style',
        scope: 'modals',
        description: '根据 jakubkrehel/skills 标准打磨全局设置与弹窗设计系统',
        raw: 'style(modals): 根据 jakubkrehel/skills 标准打磨全局设置与弹窗设计系统'
      },
      {
        id: 'v1.0.1-25',
        type: 'style',
        scope: 'settings',
        description: '根据 jakubkrehel/skills 标准打磨图标、颜色、字体与同心圆角间距',
        raw: 'style(settings): 根据 jakubkrehel/skills 标准打磨图标、颜色、字体与同心圆角间距'
      },
      {
        id: 'v1.0.1-26',
        type: 'refactor',
        scope: 'settings',
        description: "移除'减少动态样式效果'设置项，精简视图偏好选项",
        raw: "refactor(settings): 移除'减少动态样式效果'设置项，精简视图偏好选项"
      },
      {
        id: 'v1.0.1-27',
        type: 'style',
        scope: 'settings',
        description: '移除底部弹框 footer 中多余的当前分类指示',
        raw: 'style(settings): 移除底部弹框 footer 中多余的当前分类指示'
      },
      {
        id: 'v1.0.1-28',
        type: 'fix',
        scope: 'settings',
        description: '禁用点击遮罩层 (mask) 关闭弹框，防止误触丢失配置',
        raw: 'fix(settings): 禁用点击遮罩层 (mask) 关闭弹框，防止误触丢失配置'
      },
      {
        id: 'v1.0.1-29',
        type: 'fix',
        scope: 'ai',
        description: '优化连通性测试提示文案与展示位置，增加全局 Toast 反馈与即时内联状态',
        raw: 'fix(ai): 优化连通性测试提示文案与展示位置，增加全局 Toast 反馈与即时内联状态'
      },
      {
        id: 'v1.0.1-30',
        type: 'style',
        scope: 'settings',
        description: '全面去除设置弹框内标题下方冗余的描述性说明，保持极简现代风格',
        raw: 'style(settings): 全面去除设置弹框内标题下方冗余的描述性说明，保持极简现代风格'
      },
      {
        id: 'v1.0.1-31',
        type: 'style',
        scope: 'ai',
        description: '精简 AI 大模型配置文案，去除冗余说明与长句描述',
        raw: 'style(ai): 精简 AI 大模型配置文案，去除冗余说明与长句描述'
      },
      {
        id: 'v1.0.1-32',
        type: 'refactor',
        scope: 'settings',
        description: '移除多余的本地优先架构提示与侧边栏声明',
        raw: 'refactor(settings): 移除多余的本地优先架构提示与侧边栏声明'
      },
      {
        id: 'v1.0.1-33',
        type: 'fix',
        scope: 'settings',
        description: '隔离移动端与PC端侧边栏渲染，根除 .grid 类名污染导致的布局被挤压变形问题',
        raw: 'fix(settings): 隔离移动端与PC端侧边栏渲染，根除 .grid 类名污染导致的布局被挤压变形问题'
      },
      {
        id: 'v1.0.1-34',
        type: 'style',
        scope: 'settings',
        description: '彻底消除横向滚动条，重构卡片质感配色与品牌视觉层次',
        raw: 'style(settings): 彻底消除横向滚动条，重构卡片质感配色与品牌视觉层次'
      },
      {
        id: 'v1.0.1-35',
        type: 'feat',
        scope: 'settings',
        description: '将设置弹窗重构为桌面侧边栏布局，全面升级大模型 AI 接口配置中心',
        raw: 'feat(settings): 将设置弹窗重构为桌面侧边栏布局，全面升级大模型 AI 接口配置中心'
      },
      {
        id: 'v1.0.1-36',
        type: 'fix',
        scope: 'settings',
        description: '修复设置弹框遮罩层 z-index 高于内容层导致无法交互的问题',
        raw: 'fix(settings): 修复设置弹框遮罩层 z-index 高于内容层导致无法交互的问题'
      },
      {
        id: 'v1.0.1-37',
        type: 'refactor',
        scope: 'settings',
        description: '全面采用官方 shadcn/ui 组件规范重构设置弹框及子模块',
        raw: 'refactor(settings): 全面采用官方 shadcn/ui 组件规范重构设置弹框及子模块'
      },
      {
        id: 'v1.0.1-38',
        type: 'fix',
        scope: 'settings',
        description: '修复设置弹框开关列表被全局 grid 挤压成单字竖排的布局错乱',
        raw: 'fix(settings): 修复设置弹框开关列表被全局 grid 挤压成单字竖排的布局错乱'
      },
      {
        id: 'v1.0.1-39',
        type: 'refactor',
        scope: 'settings',
        description: '基于分类与设计规范重构设置弹框为三标签页架构',
        raw: 'refactor(settings): 基于分类与设计规范重构设置弹框为三标签页架构'
      },
      {
        id: 'v1.0.1-40',
        type: 'fix',
        scope: 'search',
        description: '使用 shadcn/ui 的 Input 组件重构搜索框并解决图标与占位文本重叠问题',
        raw: 'fix(search): 使用 shadcn/ui 的 Input 组件重构搜索框并解决图标与占位文本重叠问题'
      },
      {
        id: 'v1.0.1-41',
        type: 'fix',
        scope: 'navbar',
        description: '使用 CSS Grid 实现顶栏输入框真居中并修复布局错乱',
        raw: 'fix(navbar): 使用 CSS Grid 实现顶栏输入框真居中并修复布局错乱'
      },
      {
        id: 'v1.0.1-42',
        type: 'fix',
        scope: 'navbar',
        description: '将搜索框绝对居中固定并彻底去除点击时类名切换与伸缩动画',
        raw: 'fix(navbar): 将搜索框绝对居中固定并彻底去除点击时类名切换与伸缩动画'
      },
      {
        id: 'v1.0.1-43',
        type: 'fix',
        scope: 'navbar',
        description: '规范顶栏输入框默认布局并移除聚焦伸缩晃动动画',
        raw: 'fix(navbar): 规范顶栏输入框默认布局并移除聚焦伸缩晃动动画'
      },
      {
        id: 'v1.0.1-44',
        type: 'docs',
        description: '更新 AGENTS.md 与 GEMINI.md 架构与规范说明为 TypeScript',
        raw: 'docs: 更新 AGENTS.md 与 GEMINI.md 架构与规范说明为 TypeScript'
      },
      {
        id: 'v1.0.1-45',
        type: 'refactor',
        description: '完成单页入口 app/page.tsx 全量 TypeScript 重构与类型补全',
        raw: 'refactor: 完成单页入口 app/page.tsx 全量 TypeScript 重构与类型补全'
      },
      {
        id: 'v1.0.1-46',
        type: 'refactor',
        description: '重构根布局、全局错误页与查询提供者为 TypeScript 规范',
        raw: 'refactor: 重构根布局、全局错误页与查询提供者为 TypeScript 规范'
      },
      {
        id: 'v1.0.1-47',
        type: 'refactor',
        description: '完成所有核心组件 TypeScript 重构（含弹窗调度、卡片与双端表格视图）',
        raw: 'refactor: 完成所有核心组件 TypeScript 重构（含弹窗调度、卡片与双端表格视图）'
      },
      {
        id: 'v1.0.1-48',
        type: 'refactor',
        description: '重构我的主页、行情页面与基金列表视图为 TypeScript 规范',
        raw: 'refactor: 重构我的主页、行情页面与基金列表视图为 TypeScript 规范'
      },
      {
        id: 'v1.0.1-49',
        type: 'refactor',
        description: '重构我的收益日历页面组件为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 重构我的收益日历页面组件为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-50',
        type: 'refactor',
        description: '重构分时图、走势图、通用控件与图标集为 TypeScript 规范',
        raw: 'refactor: 重构分时图、走势图、通用控件与图标集为 TypeScript 规范'
      },
      {
        id: 'v1.0.1-51',
        type: 'refactor',
        description: '重构导航栏、大盘指数折叠面板与移动端详情抽屉为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 重构导航栏、大盘指数折叠面板与移动端详情抽屉为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-52',
        type: 'refactor',
        description: '重构收益明细与历史净值组件集为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 重构收益明细与历史净值组件集为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-53',
        type: 'refactor',
        description: '重构锁屏界面、数据源选择器及全局工具组件为 TypeScript 规范',
        raw: 'refactor: 重构锁屏界面、数据源选择器及全局工具组件为 TypeScript 规范'
      },
      {
        id: 'v1.0.1-54',
        type: 'refactor',
        description: '重构用户菜单、刷新按钮、扫码按钮及常驻控制组件为 TypeScript 与规范化',
        raw: 'refactor: 重构用户菜单、刷新按钮、扫码按钮及常驻控制组件为 TypeScript 与规范化'
      },
      {
        id: 'v1.0.1-55',
        type: 'refactor',
        description: '重构全部板块、更新日志、导入确认与登录弹窗为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 重构全部板块、更新日志、导入确认与登录弹窗为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-56',
        type: 'refactor',
        description: '重构基金标签编辑弹窗组件集为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 重构基金标签编辑弹窗组件集为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-57',
        type: 'refactor',
        description: '全量重构设置与配置类弹窗为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 全量重构设置与配置类弹窗为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-58',
        type: 'refactor',
        description: '全量升级交易记录类弹窗与资产汇总卡片为 TypeScript 与 shadcn/ui 规范',
        raw: 'refactor: 全量升级交易记录类弹窗与资产汇总卡片为 TypeScript 与 shadcn/ui 规范'
      },
      {
        id: 'v1.0.1-59',
        type: 'refactor',
        description: '重构 TradeModal 与 DcaModal 为 TypeScript 与 shadcn/ui 组件规范',
        raw: 'refactor: 重构 TradeModal 与 DcaModal 为 TypeScript 与 shadcn/ui 组件规范'
      },
      {
        id: 'v1.0.1-60',
        type: 'refactor',
        scope: 'ui',
        description: '落地 UI 排查治理与 P0/P1 缺陷修复 (等宽数字、Safari防缩放、Emoji图标矢量化、弹窗TS/shadcn升级)',
        raw: 'refactor(ui): 落地 UI 排查治理与 P0/P1 缺陷修复 (等宽数字、Safari防缩放、Emoji图标矢量化、弹窗TS/shadcn升级)'
      },
      {
        id: 'v1.0.1-61',
        type: 'refactor',
        description: '重构业务弹窗模块为 TypeScript 与 shadcn/ui 组件规范',
        raw: 'refactor: 重构业务弹窗模块为 TypeScript 与 shadcn/ui 组件规范'
      },
      {
        id: 'v1.0.1-62',
        type: 'refactor',
        description: '全量升级 components/ui 基础组件库为 TypeScript',
        raw: 'refactor: 全量升级 components/ui 基础组件库为 TypeScript'
      },
      {
        id: 'v1.0.1-63',
        type: 'refactor',
        description: '推进 TypeScript 架构改造与全面接入 shadcn/ui 组件库',
        raw: 'refactor: 推进 TypeScript 架构改造与全面接入 shadcn/ui 组件库'
      },
      {
        id: 'v1.0.1-64',
        type: 'perf',
        description: '深度优化 UI 渲染性能与存储状态流转，消除全树重绘与操作掉帧',
        raw: 'perf: 深度优化 UI 渲染性能与存储状态流转，消除全树重绘与操作掉帧'
      },
      {
        id: 'v1.0.1-65',
        type: 'fix',
        description: '将 AI 大模型配置直接整合至主设置弹窗，并增加 SQLite 立即同步与多端回显保障',
        raw: 'fix: 将 AI 大模型配置直接整合至主设置弹窗，并增加 SQLite 立即同步与多端回显保障'
      },
      {
        id: 'v1.0.1-66',
        type: 'feat',
        description: '支持通过 API Key 动态拉取服务商模型列表并提供下拉选择',
        raw: 'feat: 支持通过 API Key 动态拉取服务商模型列表并提供下拉选择'
      },
      {
        id: 'v1.0.1-67',
        type: 'feat',
        description: '集成通用 OpenAI / OpenAPI 兼容大模型 SDK，支持 DeepSeek 等多平台持仓智能提取与可视化配置',
        raw: 'feat: 集成通用 OpenAI / OpenAPI 兼容大模型 SDK，支持 DeepSeek 等多平台持仓智能提取与可视化配置'
      },
      {
        id: 'v1.0.1-68',
        type: 'feat',
        description: '去除 Pro 限制，全面改造为本地 SQLite 存储与私有密码防窥登录系统',
        raw: 'feat: 去除 Pro 限制，全面改造为本地 SQLite 存储与私有密码防窥登录系统'
      }
    ]
  }
];

/**
 * 解析单行日志文本为结构化 ChangeItem
 */
export function parseChangeLine(line: string, fallbackId: string): ChangeItem | null {
  if (!isString(line)) return null;
  const clean = line.replace(/^[-*•]\s*/, '').trim();
  if (isEmpty(clean) || clean.startsWith('#') || clean === '变更') return null;

  const match = clean.match(/^(feat|fix|perf|style|refactor|docs|chore|ci)(?:\(([^)]+)\))?:\s*(.*)$/i);
  if (match) {
    const rawType = match[1].toLowerCase() as ChangeType;
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

  let guessedType: ChangeType = 'other';
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

/**
 * 将 GitHub API 返回的 Release 结构转换并解析为 ReleaseLog
 */
export function parseGithubRelease(raw: any): ReleaseLog | null {
  if (!isObject(raw)) return null;
  const r = raw as Record<string, any>;
  const tag = isString(r.tag_name) ? r.tag_name : isString(r.name) ? r.name : '';
  if (isEmpty(tag)) return null;

  const publishedAt = isString(r.published_at)
    ? r.published_at.slice(0, 10)
    : isString(r.created_at)
      ? r.created_at.slice(0, 10)
      : '';

  const body = isString(r.body) ? r.body : '';
  const lines = body.split(/\r?\n/);
  const items: ChangeItem[] = [];

  lines.forEach((line, idx) => {
    const item = parseChangeLine(line, `${tag}-remote-${idx}`);
    if (item) {
      items.push(item);
    }
  });

  return {
    id: tag,
    tagName: tag,
    version: tag.replace(/^v/, ''),
    title: isString(r.name) && r.name !== tag ? r.name : `${tag} 版本更新`,
    publishedAt,
    htmlUrl: isString(r.html_url) ? r.html_url : `https://github.com/wavesbig/fund-farm/releases/tag/${tag}`,
    items:
      items.length > 0
        ? items
        : [
            {
              id: `${tag}-default`,
              type: 'other',
              description: body.trim() || '版本发布更新',
              raw: body.trim() || '版本发布更新'
            }
          ]
  };
}

/**
 * 混合并去重远端 Releases 与内置 Releases
 */
export function mergeReleases(remoteList?: any[]): ReleaseLog[] {
  if (!isArray(remoteList) || remoteList.length === 0) {
    return BUILTIN_RELEASES;
  }

  const map = new Map<string, ReleaseLog>();

  // 1. 先注入内置数据
  BUILTIN_RELEASES.forEach((r) => {
    map.set(r.tagName, r);
  });

  // 2. 将 GitHub 获取的数据合并，若版本一致且远程有更多内容则覆盖/补充，远程有新版本则追加
  remoteList.forEach((raw) => {
    const parsed = parseGithubRelease(raw);
    if (!parsed) return;
    const existing = map.get(parsed.tagName);
    if (!existing) {
      map.set(parsed.tagName, parsed);
    } else if (parsed.items.length > 0 && parsed.items[0].description !== '版本发布更新') {
      map.set(parsed.tagName, {
        ...existing,
        title: parsed.title || existing.title,
        publishedAt: parsed.publishedAt || existing.publishedAt,
        items: parsed.items.length > 0 ? parsed.items : existing.items,
        htmlUrl: parsed.htmlUrl || existing.htmlUrl
      });
    }
  });

  // 3. 按版本号降序排序
  return Array.from(map.values()).sort((a, b) => {
    const vA = a.version.split('.').map(Number);
    const vB = b.version.split('.').map(Number);
    for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
      const numA = vA[i] ?? 0;
      const numB = vB[i] ?? 0;
      if (numA !== numB) return numB - numA;
    }
    return (b.publishedAt || '').localeCompare(a.publishedAt || '');
  });
}
