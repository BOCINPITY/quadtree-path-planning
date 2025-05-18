# 毕业设计后端项目文档

## 项目概述
本项目是一个基于 Koa.js 框架的后端服务，旨在为毕业设计提供 API 支持。项目采用 MySQL 作为数据库，结合 Sequelize 进行 ORM 操作，并通过 JWT 实现用户认证。

---

## 技术栈
- **语言**：JavaScript (Node.js)
- **框架**：Koa.js
- **数据库**：MySQL
- **ORM**：Sequelize
- **认证**：JWT (jsonwebtoken)
- **日志**：Log4js
- **文档**：Swagger (swagger-jsdoc 和 swagger-ui-koa)

---

## 项目结构
```
Dockerfile
index.js
package.json
README.md
syncModels.js
apidoc/
	...API 文档相关文件...
controllers/
	...控制器文件...
logs/
	...日志文件...
middleware/
	...中间件文件...
model/
	...数据库模型文件...
routes/
	...路由文件...
utils/
	...工具类文件...
```

### 主要目录说明
- **controllers/**：控制器层，处理具体的业务逻辑。
- **middleware/**：中间件层，处理全局功能（如日志记录、错误处理、权限验证等）。
- **model/**：模型层，定义数据库表结构。
- **routes/**：路由层，定义 API 路由及其对应的控制器。
- **utils/**：工具层，包含数据库连接和其他工具类文件。
- **logs/**：存储错误和成功日志。

---

## 功能模块

### 1. 用户模块
- **功能**：用户注册、登录、信息更新。
- **实现**：
  - 使用 `bcrypt` 对用户密码进行加密。
  - 使用 JWT 生成和验证用户的认证令牌。
  - 通过 Sequelize 操作 `User` 表。

### 2. 地图模块
- **功能**：地图信息的增删改查。
- **实现**：
  - 使用 `uuid` 为每个地图障碍物生成唯一 ID。
  - 通过 Sequelize 操作 `Map` 表。

### 3. 登录日志模块
- **功能**：记录用户的登录信息。
- **实现**：
  - 记录用户的 IP 地址、登录时间和 User-Agent。
  - 通过 Sequelize 操作 `LoginLog` 表。

### 4. 认证模块
- **功能**：用户登录和注册。
- **实现**：
  - 验证用户凭据，生成 JWT。
  - 记录登录日志。

---

## 数据库设计

### 数据库连接
- **文件**：`utils/db.js`
- **功能**：通过 Sequelize 连接 MySQL 数据库，配置了数据库名称、用户名、密码和端口。

### 数据库模型
- **用户表 (User)**：存储用户的基本信息。
- **地图表 (Map)**：存储地图的基本信息。
- **登录日志表 (LoginLog)**：记录用户的登录信息。

---

## 中间件

### 1. 全局错误处理
- **文件**：`middleware/globalErrorMiddleware.js`
- **功能**：捕获未处理的异常，返回统一的错误响应。

### 2. 日志记录
- **文件**：`middleware/loggingMiddleware.js`
- **功能**：记录每个请求的日志，并在发生错误时记录错误日志。

### 3. 权限验证
- **文件**：`middleware/authenticateToken.js`
- **功能**：验证请求头中的 JWT Token，确保用户已登录。

### 4. Swagger 文档
- **文件**：`middleware/swaggerMiddleware.js`
- **功能**：生成并提供 API 文档。

---

## 部署方式

### 1. 本地运行
1. 安装依赖：
   ```bash
   npm install
   ```
2. 同步数据库：
   ```bash
   npm run sync:database
   ```
3. 启动服务：
   ```bash
   npm start
   ```

### 2. Docker 部署
1. 构建 Docker 镜像：
   ```bash
   docker build -t backend .
   ```
2. 运行容器：
   ```bash
   docker run -p 3000:3000 backend
   ```

---

## 改进建议
1. **环境变量管理**：将敏感信息（如数据库密码、JWT 密钥）提取到 `.env` 文件中，使用 `dotenv` 加载。
2. **单元测试**：添加单元测试，确保各模块功能的正确性。
3. **性能优化**：为数据库查询添加索引，优化查询性能。
4. **日志管理**：对日志文件进行分割和归档，避免日志文件过大。

---

## 参考文献
- Koa.js 官方文档: [https://koajs.com/](https://koajs.com/)
- Sequelize 官方文档: [https://sequelize.org/](https://sequelize.org/)
- Swagger 官方文档: [https://swagger.io/](https://swagger.io/)