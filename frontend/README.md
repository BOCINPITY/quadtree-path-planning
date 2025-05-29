# 基于四叉树的路径规划演示系统

## 项目简介

本项目为一个基于四叉树结构的路径规划可视化系统，支持地图编辑、A*与Dijkstra算法演示、四叉树分割动画、开放地图社区等功能。系统前端基于 Vue3 + TypeScript + Element Plus + vue-konva 实现，界面美观，交互友好，适合教学、演示与研究用途。

## 主要功能

- **地图编辑器**：支持添加/编辑/删除障碍物，地图参数自定义，起点终点设置，地图保存与加载。
- **四叉树分割动画**：可视化四叉树空间分割过程，支持单步、自动播放、跳过等操作。
- **路径规划算法演示**：支持 A* 和 Dijkstra 算法，启发函数可选，路径动画演示。
- **开放地图社区**：浏览、预览、加载社区用户共享的地图，支持一键加载到编辑器。
- **地图管理**：地图列表分页、筛选、编辑、删除，支持开放社区开关、分割线颜色等参数。
- **用户系统**：注册、登录、验证码、个人信息管理、登录日志等。
- **性能对比**：算法性能测试与对比，支持多地图选择。（未开发）

## 技术栈

- **前端框架**：Vue 3, TypeScript, Vite
- **UI组件库**：Element Plus
- **可视化**：vue-konva (Konva.js)
- **动画**：GSAP
- **状态管理**：Pinia
- **路由**：Vue Router
- **样式**：CSS3, SCSS, iconfont

## 目录结构

```
src/
  assets/           # 静态资源（图片、iconfont等）
  components/       # 公共组件（如MapPreView、UserInfo等）
  http/             # API请求模块
  router/           # 路由配置
  store/            # 状态管理
  utils/            # 工具函数与算法实现
  views/            # 各页面视图
    MapEditor/      # 地图编辑器
    MapManager/     # 地图管理
    OpenMapsCommunity/ # 开放地图社区
    LoginAndRegister/  # 登录注册
    Setting/           # 用户设置
    AlgorithmPerformanceComparison/ # 算法性能对比
  @types/           # TypeScript类型定义
  main.ts           # 入口文件
  App.vue           # 根组件
```

## 快速开始

1. **安装依赖**

   ```powershell
   npm install
   ```

2. **运行开发环境**

   ```powershell
   npm run dev
   ```

3. **打包构建**

   ```powershell
   npm run build
   ```

## 主要页面与入口

- `/system`         - 地图编辑器主界面
- `/system/mapmanager` - 地图管理
- `/system/open_maps_community` - 开放地图社区
- `/system/apc`     - 算法性能对比
- `/system/user`    - 用户设置
- `/login`          - 登录/注册

## 特色说明

- **四叉树分割动画**：支持单步、自动、跳过，动画流畅，便于理解空间分割原理。
- **地图社区**：支持地图缩略图、作者信息、邮箱保护（tooltip显示）、一键加载到编辑器。
- **地图编辑**：支持分割线颜色、最小分割阈值、开放社区开关等高级参数。
- **用户体验**：所有异步操作均有 loading 状态，表单校验友好，操作有二次确认。

## 贡献与反馈

如有建议、bug反馈或需求，欢迎通过 [Gitee 项目地址](https://gitee.com/bocinpity/cles-dev) 提 issue 或 PR。

---

> 本项目为毕业设计作品，代码仅供学习与交流，禁止用于商业用途。
