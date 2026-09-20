const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken
const { JWT_SECRET } = require('../config');

// 验证 token 的中间件
const authenticateToken = async (ctx, next) => { // 确保函数是 async
    const authHeader = ctx.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 从 Authorization 头中提取 token
    if (!token) {
        ctx.status = 401;
        ctx.body = { message: '未提供 token' };
        return;
    }

    try {
        const user = jwt.verify(token, JWT_SECRET); // 验证 token
        ctx.user = user; // 将解码后的用户信息存储到 ctx 对象中
        await next(); // 使用 await 调用 next()
    } catch (err) {
        ctx.status = 403;
        ctx.body = { message: '无效的 token' };
    }
};

module.exports = authenticateToken;
