# 基估宝-实时基金估值

一个基于 Next.js 开发的基金估值与重仓股实时追踪工具。采用玻璃拟态设计（Glassmorphism），支持移动端适配，数据通过 Node 22 原生 SQLite 实现秒级实时自动持久化。

## 📸 界面预览

### PC 端界面

<img src="./doc/pc-demo-01.png" width="600" alt="PC 端主界面">

---

<img src="./doc/pc-demo-02.png" width="600" alt="PC 端交易与设置">

---

### 移动端界面

<img src="./doc/mobile-demo-01.png" width="300" alt="移动端适配界面">

## ✨ 特性

- **实时估值**：通过输入基金代码，实时获取并展示基金单位净值、估值净值及实时盘中涨跌幅。
- **重仓追踪**：自动获取基金前 10 大重仓股票，并实时追踪重仓股盘中涨跌情况，支持折叠/展开。
- **关联板块与指数穿透**：内置收录 6,000+ 基金与对应基准指数映射，开箱即用展示关联板块（如纳斯达克100、沪深300等）实时盘中走势。
- **纯前端直连**：采用 JSONP 与动态脚本注入方案直连东方财富、腾讯财经公开接口，解决跨域限制。
- **SQLite 实时持久化**：采用 Node 22 原生 SQLite（`fund.db`）结合前端 `localStorage` 双重存储架构，自动实时落盘保存，多设备数据无缝流转。
- **私有防窥锁屏**：支持设置独立访问密码与锁屏保护，接口 401 权限拦截，未解锁绝不泄露资产数据。
- **AI 智能识别**：支持离线纯前端 OCR 截图导入，亦支持接入 OpenAI / DeepSeek / 硅基流动等兼容大模型，自动提取持仓截图信息。
- **持仓与收益计算**：精确记录持有份额与成本价，自动计算单日盈亏、持仓收益及累计盈亏。
- **定投计划与交易记录**：支持买入/卖出历史追踪与自动定投计划设置。
- **自选与分组管理**：支持自定义基金分组与自选筛选，支持拖拽与多种维度自定义排序。
- **明暗主题与响应式**：原生玻璃拟态设计（Glassmorphism），深色/浅色一键换肤，全面适配移动端与桌面端。

## 🛠 技术栈

- **框架**：[Next.js](https://nextjs.org/) (App Router, 全栈 TypeScript)
- **运行环境**：Node.js >= 22（内置 `node:sqlite` 原生数据库）
- **样式**：Tailwind CSS v4 + 玻璃拟态设计 + [shadcn/ui](https://ui.shadcn.com/)
- **状态管理**：Zustand + TanStack Query (React Query)
- **数据源**：
  - 基金估值：天天基金 (JSONP)
  - 重仓数据：东方财富 (HTML Parsing)
  - 股票行情：腾讯财经 (Script Tag Injection)
- **容器化**：Docker / Docker Compose（Node 22 Alpine 生产镜像）

## 🚀 快速开始

### 本地开发

1. 克隆仓库：

   ```bash
   git clone https://github.com/<your-username>/real-time-fund.git
   cd real-time-fund
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 配置环境变量（可选）：

   ```bash
   cp env.example .env.local
   ```

   根据需要填入配置（均可选，亦可在网页偏好设置中直接配置）：
   - `OPENAI_API_KEY`：OpenAI / DeepSeek / 硅基流动等兼容 API Key（用于截图智能解析）
   - `OPENAI_BASE_URL`：兼容服务商 API Base URL（默认 `https://api.deepseek.com/v1`）
   - `OPENAI_MODEL`：模型名称（如 `deepseek-chat`）
   - `APP_PASSWORD`：私有访问密码强行重置（可选）
   - `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`：Web3Forms 反馈表单 Access Key（可选）
   - `NEXT_PUBLIC_GA_ID`：Google Analytics Measurement ID（可选）
   - `NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL`：GitHub 最新 Release 检查接口（可选）

4. 启动开发服务器：

   ```bash
   npm run dev
   ```

   访问 [http://localhost:3000](http://localhost:3000) 即可使用。

### 🐳 Docker 部署（推荐）

本项目已提供多阶段构建的 `Dockerfile` 与 `docker-compose.yml`，支持一键拉起 Node 22 全栈服务并持久化 SQLite 数据库。

#### 方式一：Docker Compose（推荐）

```bash
# 启动并在后台构建运行
docker compose up -d --build
```

- **访问地址**：[http://localhost:3000](http://localhost:3000)
- **数据持久化**：SQLite 数据库自动保存在本地 `./data/fund.db`，容器重启或重建不丢失。

#### 方式二：Docker CLI 手动运行

```bash
# 1. 构建镜像
docker build -t real-time-fund:latest .

# 2. 运行容器（挂载本地 data 目录持久化存储）
docker run -d \
  -p 3000:3000 \
  --name real-time-fund \
  --restart always \
  -v $(pwd)/data:/app/data \
  real-time-fund:latest
```

如需传入环境变量，可通过 `--env-file .env` 启动：

```bash
docker run -d -p 3000:3000 --name real-time-fund --restart always --env-file .env -v $(pwd)/data:/app/data real-time-fund:latest
```

## 📖 使用说明

1. **添加基金**：在顶部输入框输入 6 位基金代码（如 `110022`），点击“添加”。
2. **查看详情**：卡片将展示实时估值及前 10 重仓股的占比与今日涨跌。
3. **调整频率**：点击右上角“设置”图标，可调整自动刷新的间隔时间。
4. **删除基金**：点击卡片右上角的红色删除图标即可移除。

## 📝 免责声明

本项目所有数据均来自公开接口，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议。

## 🙏 致谢 (Acknowledgements)

本项目基于开源项目 [real-time-fund](https://github.com/hzm0321/real-time-fund) 进行重构与二次开发，感谢原作者 [hzm0321](https://github.com/hzm0321) 及开源社区贡献者为本项目奠定的基础架构。

## 📄 开源协议 (License)

本项目采用 **[GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html)**（AGPL-3.0）开源协议。

- **允许**：自由使用、修改、分发本软件；若你通过网络服务向用户提供基于本项目的修改版本，须向该服务的用户提供对应源代码。
- **要求**：基于本项目衍生或修改的作品需以相同协议开源，并保留版权声明与协议全文。
- **无担保**：软件按「原样」提供，不提供任何明示或暗示的担保。

完整协议文本见仓库根目录 [LICENSE](./LICENSE) 文件，或 [GNU AGPL v3 官方说明](https://www.gnu.org/licenses/agpl-3.0.html)。
