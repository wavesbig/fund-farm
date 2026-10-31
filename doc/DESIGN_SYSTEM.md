# 基估宝设计系统规范 (Stripe Fintech Design System)

本项目基于 [Stripe Design System (OpenDesign Tokens)](https://open-design.ai/plugins/design-system-stripe/) 进行系统化重构与沉淀，旨在为基金实时估值与持仓管理提供清晰、克制、专业且极富金融质感的设计语言。

---

## 1. 颜色令牌 (Color Tokens)

### 1.1 主品牌色 (Primary & Brand Voltage)
| Token | 暗色 (Dark) | 亮色 (Light) | 用途 |
| :--- | :--- | :--- | :--- |
| `--primary` | `#6366f1` | `#4f46e5` | 核心操作按钮、高亮指示、重点交互 (对比度均 > 5.5:1) |
| `--secondary` | `#1e293b` | `#e2e8f0` | 次级按钮底色、分段控制器轨道底色 |
| `--secondary-foreground` | `#f8fafc` | `#0f172a` | 次级高亮文本 |

### 1.2 画布与层级底色 (Canvas & Surfaces)
| Token | 暗色 (Dark) | 亮色 (Light) | 说明 |
| :--- | :--- | :--- | :--- |
| `--bg` / `--background` | `#0b0f19` (Obsidian Slate) | `#f1f5f9` (Slate Canvas) | 页面整体背景。亮色采用 94.5% 明度 Slate，与纯白卡片形成立体分层 |
| `--card` | `#111827` (Slate 900) | `#ffffff` (Pure White) | 卡片主体背景、列表容器底色 |
| `--header-bg` | `#0f172a` | `#ffffff` | 顶部导航栏底色 |
| `--popover` | `#0f172a` | `#ffffff` | 下拉菜单、气泡、弹出框底色 |
| `--table-pinned-header-bg` | `#0f172a` | `#f8fafc` | 表头与冻结列固定背景，亮色与白色数据行形成层次对比 |
| `--table-row-hover-bg` | `rgba(99, 102, 241, 0.08)` | `rgba(79, 70, 229, 0.04)` | 表格行悬停高亮微色 |
| `--border` | `rgba(255, 255, 255, 0.1)` | `#e2e8f0` (Slate 200) | 结构清晰的边缘描边 |

### 1.3 墨水层级 (Typography Inks)
| Token | 暗色 (Dark) | 亮色 (Light) | 用途与对比度 |
| :--- | :--- | :--- | :--- |
| `--foreground` | `#f8fafc` | `#0f172a` | 主要标题、数值展示（暗色与白色下均达到 15:1+ 极致对比） |
| `--muted-foreground` | `#cbd5e1` (Slate 300) | `#475569` (Slate 600) | 表头文字、基金代码、副标题、说明文字（暗色提升至 10.4:1，亮色达到 7.0:1+ WCAG AAA 顶级标准） |
| `--muted` | `#e2e8f0` (Slate 200) | `#64748b` (Slate 500) | 弱化指示、图标轮廓（暗色达到 12.5:1，彻底消除模糊感） |

### 1.4 金融状态指示色 (Financial Accents)
| 业务状态 | 暗色 (Dark) | 亮色 (Light) | 说明与对比度 |
| :--- | :--- | :--- | :--- |
| **当日上涨 / 盈利 (Danger)** | `#fb7185` (Rose 400) | `#dc2626` (Red 600) | 暗色对比度 8.3:1 (AAA) 鲜亮清晰；亮色对比度 5.2:1 沉稳有力 |
| **当日下跌 / 亏损 (Success)** | `#34d399` (Emerald 400) | `#16a34a` (Green 600) | 暗色对比度 10.5:1 (AAA)；亮色对比度 5.0:1 |
| **警告 / 待同步 (Warning)** | `#fbbf24` (Amber 400) | `#d97706` (Amber 600) | 状态预警 |

---

## 2. 排版、字号标准与等宽数字 (Typography Scale)

* **字体栈**: `-apple-system, BlinkMacSystemFont, "Söhne", "Segoe UI", Roboto, "Helvetica Neue", sans-serif`
* **根字号基准**: 全局 `html { font-size: 16px }`（废止移动端 13px 萎缩压缩，保证全平台文字自然舒展清晰）。
* **字号分阶规范 (整体上调一档，消除紧凑感与模糊感)**:
  * 表格主数值 / 估值 / 金额：`clamp(14.5px, 1.2vw, 16.5px)`（PC）/ `clamp(14px, 3.8vw, 16px)`（移动），彻底废除原 10px-13px 紧缩字号。
  * 基金名称：`16px`（PC，粗体 `600`）/ `15px`（移动端 2 行截断，粗体 `600`）。
  * 分组选项卡与按钮标签 (`FilterBar` / `.tab`)：`14px`（高度 32px，行高 32px，内边距 14px）。
  * 表头单元格 (`.table-header-cell`)：`14px`（PC，字重 600）/ `13px`（移动端，字重 600）。
  * 卡片指标值 (`Stat.value`)：`17px` - `20px`（粗体 600）。
  * 基金代码 / 时间戳 / 副标题 / 指标标签 (`Stat.label`)：统一为标准 `12px - 13px`，彻底告别 8px-11px 模糊微距。
  * 状态指示标签（DCA/待确认/已更新）：`12px`，高度 18px。
* **数字等宽渲染**:
  ```css
  font-feature-settings: 'ss01' 1, 'tnum' 1;
  font-variant-numeric: tabular-nums;
  ```
  所有金额、百分比、净值、日期列均启用固定等宽数字，彻底避免数据轮询刷新时文字抖动。

---

## 3. 圆角比例系统 (Radii Scale)

摒弃无边界的药丸式（`rounded-full`）大圆角，采用 Stripe 精致工程感的几何尺度：

| 级别 | 数值 | 适用组件 |
| :--- | :--- | :--- |
| `rounded-xs` | `4px` | 小型状态微徽章、指示点 |
| `rounded-sm` | `6px` | 按钮、输入框、表头单元格把手、下拉选项项 |
| `rounded-md` | `8px` | 分段控制器外框（Tabs Track）、搜索输入框、浮动操作组 |
| `rounded-lg` / `rounded-xl` | `12px` | 核心卡片 (`GroupSummary`, `FundCard`)、模态对话框、表格主外框 |
| `rounded-2xl` | `16px` | 抽屉底部大面板 (`DrawerContent`) |

---

## 4. 环境光阴影体系 (Atmospheric Elevation)

采用多层物理衰减阴影，取代单纯的大半径模糊毛玻璃：

* **Card / 基础卡片**:
  * 亮色: `0 2px 5px -1px rgba(50, 50, 93, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.06)`
  * 暗色: `0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2)`
* **Hover / 卡片悬停**:
  * 亮色: `0 6px 12px -2px rgba(50, 50, 93, 0.11), 0 3px 7px -3px rgba(0, 0, 0, 0.06)`
  * 暗色: `0 7px 14px -3px rgba(50, 50, 93, 0.16), 0 3px 6px -2px rgba(0, 0, 0, 0.1)`
* **Dropdown / 弹出浮层**:
  * 亮色: `0 13px 27px -5px rgba(50, 50, 93, 0.12), 0 8px 16px -8px rgba(0, 0, 0, 0.08)`
  * 暗色: `0 13px 27px -5px rgba(50, 50, 93, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.3)`
* **Modal / 模态框**:
  * `0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.4)`

---

## 5. 栅格与布局对齐规范 (Grid & Structural Alignment)

1. **通栏顶部导航 (`Navbar`)**:
   * 外层全宽贴顶固定 (`width: 100%; top: 0; left: 0; right: 0`)，带有底部细分界线与微阴影。
   * 内层容器 (`.navbar-inner`) 严格匹配内容区宽度 (`maxWidth: containerWidth || 1200px`) 与水平内边距 (`padding: 0 24px`)。
   * 左侧品牌 Logo 与下方工具栏、表格左边缘像素级纵向对齐；右侧操作区与表格右边缘像素级对齐。
2. **工具栏与选项卡 (`FilterBar`)**:
   * 采用 Stripe 分段控制条（Segmented Controls），外框 `bg-muted/50 border border-border rounded-lg`。
   * 选中项为凸起的实体白色/深蓝卡片，带有专属轻量阴影 `shadow-sm`。
3. **资产汇总看板 (`GroupSummary`)**:
   * 与表格同宽，展示大号金额字号并支持金额一键掩码（脱敏保护）。
4. **表格系统 (`PcFundTable` / `MobileFundTable`)**:
   * 表格行统一使用 `var(--card)` 作为绝对底色，解决冻结列与滚动列底色撕裂的问题。
   * 表头使用 `var(--table-pinned-header-bg)`，字体 `14px / 13px` 600 字重，色值 `var(--muted-foreground)`。

---

## 6. 按钮与交互动效规范 (Buttons & Motion Principles)

遵循极简、克制、沉稳的金融级 UI 原则，杜绝花哨弹簧物理碰撞与多余位移：

1. **零多余位移动画 (No Bouncy Jumps)**:
   * 移除所有悬停与按下的位移变动（如 `hover:-translate-y-0.5`、`active:translate-y-px`、`transform: translateY(-1px)`）。
   * 移除所有点击缩放抖动（如 `active:scale-95`、`active:scale-90`）。
   * 按钮及微图标点击统一使用优雅的透明度衰减（`opacity: 0.9` / `active:opacity-75`），保持界面视线完全水平平稳。
2. **纯粹标准的 shadcn/ui 按钮体系**:
   * 遵循 shadcn 经典变体：`default` (Stripe 蓝紫 `bg-primary text-primary-foreground hover:bg-primary/90`)、`outline` (`border border-border hover:bg-secondary`)、`ghost` (`hover:bg-secondary`)、`destructive` (`bg-destructive text-white hover:bg-destructive/90`)。
   * 统一使用标准 `transition-colors`（平滑颜色过渡，无几何尺寸改变）。
3. **稳健的分段控制与导航 (Segmented Tabs & Navigation)**:
   * 侧边栏 (`PcSideNav`)、移动底部栏 (`MobileBottomNav`)、行情榜单 (`MarketTab`) 与分组标签 (`FilterBar`) 全部使用纯 CSS 平滑过渡或精简类名控制。
   * 移除跨元素的 Framer Motion `layoutId` 弹簧拉伸胶囊动画，让标签切换零时滞、零跳帧，如原生桌面软件般稳健顺滑。
4. **视图切换平滑无跳跃**:
   * 列表/卡片模式切换 (`FundListView`) 直接渲染无颠簸，移除全页面纵向滑动 `y: 10` 跳动，保障用户在大数据量下的沉浸式阅览体验。
5. **导航与模态框规范 (Navigation & Dialogs)**:
   * **偏好设置模态框侧边栏 (`SettingsModal`)**：
     - 侧栏背景色彻底消除原先浑浊灰暗的 `bg-muted/15` / `bg-muted/20`，与弹窗卡片背景（`bg-card`）完全融为一体，整体界面纯净一致，消除色块突兀感。
     - 侧栏与主内容区通过极细标准边框（`border-r border-border`）自然分割。
     - 导航按钮激活态采用柔和内敛的标准次级高亮（`bg-secondary text-foreground font-semibold shadow-xs`，图标点缀 `text-primary`），未激活态采用 `text-muted-foreground hover:text-foreground hover:bg-secondary/60`。
     - 底部点缀极简版本标识（`v2.4.1`），使侧栏垂直视觉重心更加沉稳平衡。
   * **PC 桌面悬浮侧边栏 (`PcSideNav`)**：
     - 收起状态为贴边微型悬浮滑块（宽 22px，圆角 `0 10px 10px 0`），展开时平滑延伸为宽 66px 的现代胶囊 Dock。
     - 容器定位移除突兀跳动的 `padding` 抖动，采用平滑单一宽/高缓动曲线（`cubic-bezier(0.16, 1, 0.3, 1)`）。
     - 导航项采用圆润的 12px 圆角几何比例，激活态采用高饱和 Stripe 蓝紫实心背景（`var(--primary)`）与白字白图标，搭配专属软阴影，兼备极致对比度与视觉美感。

