# 本地生活综合服务系统 Locallink

> 一站式本地生活服务平台，整合**社区文化、闲置交易、实时私信、天气助手**四大核心能力，零依赖一键启动。

## 系统架构

三端分离协作架构：

- **服务器端**（`server/`）：Python 3.11 + FastAPI + SQLite（零安装），统一承载业务规则、鉴权与外部服务集成
- **管理端**（`admin/`）：Vue 3 + Element Plus，面向运营人员
- **客户端**（`client-web/`）：Vue 3 + Element Plus，面向终端用户，430px 移动端居中布局
- **客户端移动端**（`client-app/`）：Flutter App（社区/闲置/出行/天气/我的）
- **客户端小程序**（`client-mp/`）：uni-app 小程序端

> 生产环境可切换至 MySQL + Redis + MongoDB + ES + MinIO + RabbitMQ，详见 `server/app/core/config.py`。

## 目录结构

```
demo1/
├── server/          # 服务器端（FastAPI + SQLite）
├── admin/           # 管理后台（Vue 3 + Element Plus）
├── client-web/      # 客户端 Web 端（Vue 3）
├── client-app/      # 客户端移动端 App（Flutter）
├── client-mp/       # 客户端小程序端（uni-app）
├── start.bat        # 一键启动（全栈，零依赖）
├── start.ps1        # 一键启动（PowerShell）
├── preview.bat      # 快速预览（仅前端界面）
├── preview.ps1      # 快速预览（PowerShell）
└── .codeartsdoer/   # 需求规格与设计文档
    └── specs/local_life_service/
        ├── spec.md      # 需求规格文档
        ├── design.md    # 技术设计文档
        └── tasks.md     # 编码任务清单
```

---

## 🚀 快速启动

### 方式一：一键启动全栈（推荐）

**双击 `start.bat`**，或在终端执行：

```bash
powershell -ExecutionPolicy Bypass -File start.ps1
```

脚本会自动完成：
1. 检查 Python / Node.js 运行环境
2. 创建 Python 虚拟环境并安装后端依赖
3. 启动后端 FastAPI 服务（:8000，SQLite 零安装）
4. 安装前端依赖并启动客户端 Web（:5173）
5. 安装前端依赖并启动管理后台（:5174）
6. **自动打开浏览器**访问客户端与管理端

> 无需 Docker、无需 MySQL/Redis/MongoDB，开箱即用。

### 方式二：快速预览前端界面（无需后端）

**双击 `preview.bat`**，或在终端执行：

```bash
powershell -ExecutionPolicy Bypass -File preview.ps1
```

> 此方式仅启动前端开发服务器，界面可正常浏览，但 API 请求会失败（无后端）。
> 适合快速查看界面布局与样式。

### 方式三：手动分步启动

#### 前置条件

| 依赖 | 版本要求 | 用途 |
|------|---------|------|
| Python | ≥ 3.11 | 后端运行 |
| Node.js | ≥ 18 | 前端构建 |

#### 1. 启动后端

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

后端启动后访问：
- API 服务：http://127.0.0.1:8000
- API 文档（Swagger）：http://127.0.0.1:8000/docs
- 健康检查：http://127.0.0.1:8000/health

> 数据存储：SQLite（`server/local_life.db`），首次启动自动建表并写入种子数据。

#### 2. 启动客户端 Web

```bash
cd client-web
npm install
npm run dev
```

访问：http://127.0.0.1:5173

#### 3. 启动管理后台

```bash
cd admin
npm install
npm run dev
```

访问：http://127.0.0.1:5174

---

## 🌐 访问地址总览

| 服务 | 地址 | 说明 |
|------|------|------|
| **客户端 Web** | http://127.0.0.1:5173 | 面向终端用户（社区/闲置/私信/天气/我的） |
| **管理后台** | http://127.0.0.1:5174 | 面向运营人员（用户/审核/统计/审计） |
| **API 文档** | http://127.0.0.1:8000/docs | Swagger 交互式 API 文档 |
| **API 服务** | http://127.0.0.1:8000 | 后端 API 基址 |

### 默认账号

| 端 | 账号 | 密码 |
|----|------|------|
| 管理后台 | `admin` | `admin123456` |
| 客户端 | `demo@example.com` | `demo123456` |

> 注册无需验证码；游客可浏览公开页面，操作类功能需登录。

---

## 📱 客户端界面说明

### 客户端 Web（http://127.0.0.1:5173）

底部 TabBar 五个入口：

| Tab | 页面 | 功能 |
|-----|------|------|
| 🏘️ 社区 | 社区广场 | 帖子列表、发帖、点赞、一级评论 |
| 🛒 闲置 | 闲置市场 | 商品搜索、商品详情、下单 |
| � 私信 | 实时私信 | 一对一即时聊天 |
| 🌤️ 天气 | 天气助手 | 实时天气、多日预报、极端天气预警 |
| 👤 我的 | 我的主页 | 个人资料、我的帖子、我的商品、我的订单 |

其他页面（通过路由访问）：
- 发帖：http://127.0.0.1:5173/post/create
- 帖子详情：http://127.0.0.1:5173/post/:id
- 商品详情：http://127.0.0.1:5173/goods/:id
- 发布商品：http://127.0.0.1:5173/trade/create
- 商品回收站：http://127.0.0.1:5173/mine/products/trash
- 订单详情：http://127.0.0.1:5173/mine/orders/:id
- 订单支付：http://127.0.0.1:5173/mine/orders/:id/pay

> 出行（`/travel`）与 AI 对话（`/ai-chat`）路由保留，可通过地址栏访问，TabBar 暂无入口。

### 管理后台（http://127.0.0.1:5174）

左侧菜单：

| 菜单 | 功能 |
|------|------|
| 工作台 | 数据统计概览（今日新增、累计趋势） |
| 用户管理 | 用户列表、冻结/解冻 |
| 帖子审核 | 帖子审核通过/驳回/下架 |
| 商品审核 | 商品上架审核、分类管理 |
| 订单管理 | 订单列表、退款审核 |
| 数据统计 | 多维度数据分析 |
| 审计日志 | 管理操作日志查询 |

---

## 🛑 停止服务

在启动脚本的终端窗口按 `Ctrl + C`，脚本会自动停止后端、客户端、管理后台所有进程。

---

## ⚠️ 常见问题

### Q: 前端页面打开但数据为空

A: 后端未启动。请确保：
1. 后端已启动（http://127.0.0.1:8000/health 返回 ok）
2. 首次启动需等待 15-20 秒完成建表与种子数据写入

### Q: 管理后台（5174）打开显示客户端界面

A: 启动脚本已修复此问题。请使用最新的 `start.ps1`，它会通过 `.\node_modules\.bin\vite.cmd` 直接调用 Vite，避免工作目录传递失效。

### Q: npm install 很慢

A: 可使用国内镜像加速：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: pip install 很慢

A: 可使用国内镜像加速：
```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q: 端口被占用

A: 修改对应配置：
- 后端端口：`server/app/main.py` 或启动参数 `--port`
- Web 端口：`client-web/vite.config.ts` 中 `server.port`
- 管理端端口：`admin/vite.config.ts` 中 `server.port`

---

## 核心能力

| 模块 | 说明 |
|------|------|
| 用户账户 | 注册登录、资料维护、身份认证 |
| 社区文化 | 图文发帖、一级评论、点赞、帖子重发 |
| 闲置交易 | 商品发布、筛选、下单、在线支付、发货收货、商品废弃与回收站 |
| 实时私信 | 一对一即时聊天、清空聊天记录 |
| 天气助手 | 实时天气、多日预报、极端天气预警推送 |
| 管理后台 | 用户管理、内容审核、订单管理、数据统计、审计日志 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python 3.11、FastAPI、SQLAlchemy 2.0（async）、SQLite / MySQL、JWT |
| 管理端 | Vue 3、Element Plus、Vite、TypeScript |
| 客户端 Web | Vue 3、Element Plus、Vite、TypeScript |
| 客户端 App | Flutter |
| 客户端小程序 | uni-app |

---

## API 前缀

| 端 | 前缀 |
|----|------|
| 客户端 | `/api/v1` |
| 管理端 | `/api/admin/v1` |
