# QuadPath

> **v2 正在开发中：** 新版本位于 [`v2/`](v2/)，移除了非核心后端业务，专注可靠的四叉树路径规划、可视化回放与可复现实验。本页其余内容记录原毕业设计版本。

基于四叉树空间划分的路径规划可视化系统。项目提供在线地图编辑、障碍物建模、四叉树逐步分割、A* 与 Dijkstra 寻路、算法性能对比，以及开放地图社区等功能。

这是一个前后端分离的毕业设计项目：前端负责地图编辑与算法可视化，后端负责用户、地图、认证、登录日志，以及四叉树和路径规划相关服务。

## 主要功能

- 可视化地图编辑器：绘制障碍物、设置起点和终点、保存与加载地图
- 四叉树空间划分：支持构建过程的分步演示和指标展示
- 路径规划：支持 A* 与 Dijkstra 算法及结果可视化
- 算法对比：对比路径长度、访问节点和执行时间等指标
- 地图管理：创建、编辑、删除和复用个人地图
- 开放地图社区：公开地图并加载其他用户分享的地图
- 用户系统：邮箱验证码注册、登录、资料与密码修改
- 登录日志：记录登录时间、位置和客户端信息

## 技术栈

### 前端

- Vue 3、TypeScript、Vite
- Element Plus、Pinia、Vue Router
- Konva / Vue Konva、GSAP
- Axios

### 后端

- Node.js、Koa 2
- MySQL、Sequelize
- JWT、bcrypt
- Swagger、Log4js

## 项目结构

```text
.
├── frontend/          # Vue 3 前端与可视化地图编辑器
└── backendRefactor/   # Koa 2 API、数据库模型和路径规划服务
```

## 本地运行

### 1. 配置后端

```bash
cd backendRefactor
cp .env.example .env
npm install
```

编辑 `.env`，至少设置 MySQL 连接信息和 `JWT_SECRET`。如需使用邮箱验证码注册，还需要填写 SMTP 配置。

初始化数据库并启动服务：

```bash
npm run sync
npm run dev
```

后端默认运行在 `http://localhost:3000`。

### 2. 启动前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`。

## 环境变量

后端配置示例见 [`backendRefactor/.env.example`](backendRefactor/.env.example)，前端接口地址配置见 [`frontend/.env.example`](frontend/.env.example)。`.env` 文件包含本地凭据，不应提交到仓库。

## 算法说明

系统首先使用四叉树根据障碍物分布递归划分地图空间，再在可通行叶子节点组成的图上执行路径搜索：

- A* 使用启发函数引导搜索，减少无效节点访问。
- Dijkstra 不使用启发信息，可作为最短路径基准进行性能对比。

更完整的算法思路见 [`frontend/src/docs/astart.md`](frontend/src/docs/astart.md)。

## License

[MIT](LICENSE)
