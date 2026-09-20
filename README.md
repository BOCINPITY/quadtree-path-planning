# QuadPath Lab

基于四叉树空间划分的路径规划可视化实验台。把栅格地图压缩成自适应空间，在可交互拓扑中观察 A* 与 Dijkstra 如何寻找路径。

在线版本部署在个人主站：https://clesbit.top/lab/quadpath/

## 当前能力

- 在网格地图上绘制或擦除障碍物
- 自定义起点和终点
- 实时构建四叉树并显示叶节点边界
- 在大小不同的自由叶节点之间建立真实的共享边邻接关系
- 运行 A* 和 Dijkstra，并对比路径长度、扩展节点数和耗时
- 回放搜索节点的扩展过程
- 导入和导出地图 JSON
- 内置可重复的测试场景
- 使用 Vitest 验证空间划分、邻接和最短路径一致性
- 中英文界面与浅色 / 深色主题切换

## 技术栈

- Vue 3 + TypeScript + Vite
- D3.js（力导向拓扑图）
- vue-i18n（中英切换）
- Vitest（单元测试）

## 运行

```bash
npm install
npm run dev
```

检查测试和生产构建：

```bash
npm run check
```

所有计算均在浏览器本地完成，不需要后端服务。

## License

[MIT](LICENSE)
