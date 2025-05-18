const Koa = require('koa');
const routes = require('./routes');
const cors = require('@koa/cors');
const globalErrorMiddleware = require('./middleware/globalErrorMiddleware');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const swaggerMiddleware = require('./middleware/swaggerMiddleware');

const app = new Koa();
const port = process.env.PORT || 3000;

// 挂载swagger-ui
app.use(swaggerMiddleware); // 使用提取后的swagger中间件

// 全局错误处理器
app.use(globalErrorMiddleware);


// 日志记录中间件
app.use(loggingMiddleware);
app.use(cors()); // 处理跨域请求
app.use(require('koa-bodyparser')()); // 解析请求体

//路由注册
Object.values(routes).forEach((route) => {
    app.use(route.routes()).use(route.allowedMethods());
});

app.listen(port, () => {
    console.info(`Server is running on port ${port}`);
});