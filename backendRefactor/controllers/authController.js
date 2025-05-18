const User = require('../model/userModel'); // 引入 User 模型
const LoginLog = require('../model/loginLogModel'); // 引入登录日志模型
const bcrypt = require('bcrypt'); // 用于密码加密
const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken
const { JWT_SECRET, TOKEN_EXPIRATION_TIME } = require('../config'); // 引入配置文件

const loginOrRegister = async (ctx) => {
    const { email, password } = ctx.request.body;
    console.log(email, password)
    //默认的用户名，如果没有传入用户名，则使用邮箱作为用户名
    if (!email || !password) {
        ctx.status = 400;
        ctx.body = { message: '邮箱和密码不能为空' };
        return;
    }

    try {
        // 检查用户是否已存在
        let user = await User.findOne({
            where: { email }
        }); // 查找用户

        if (!user) {
            // 如果用户不存在，则注册新用户
            const hashedPassword = await bcrypt.hash(password, 10); // 加密密码
            user = await User.create({ email, password: hashedPassword, name: email }); // 创建新用户

            // 生成 token
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_TIME });
            
            // 记录登录日志
            await LoginLog.create({
                userId: user.id,
                ipAddress: ctx.ip,
                loginTime: new Date(),
                userAgent: ctx.headers['user-agent'] || 'unknown',
            });

            ctx.status = 201;
            ctx.body = {
                message: '注册成功',
                user: {...user.toJSON(),password:undefined},
                token
            };
            return;
        }

        // 如果用户已存在，验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            ctx.status = 400;
            ctx.body = { message: '密码错误' };
            return;
        }

        // 生成 token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_TIME });

        // 记录登录日志
        await LoginLog.create({
            userId: user.id,
            ipAddress: ctx.ip,
            loginTime: new Date(),
            userAgent: ctx.headers['user-agent'] || 'unknown',
        });

        // 返回登录成功信息
        ctx.status = 200;
        ctx.body = {
            message: '登录成功',
            user: {...user.toJSON(),password:undefined},
            token
        };
    } catch (error) {
        console.error('登录或注册时发生错误:', error);
        ctx.status = 500;
        ctx.body = { message: '服务器错误' };
    }
};

const register = async (ctx) => {
    const { email,username, password } = ctx.request.body;

    if (!email || !password || !username) {
        ctx.status = 400;
        ctx.body = { message: '邮箱、用户名、密码不能为空' };
        return;
    }

    try {
        // 检查用户是否已存在
        let user = await User.findOne({
            where: { email }
        });

        if (user) {
            ctx.status = 400;
            ctx.body = { message: '邮箱已经被注册' };
            return;
        }

        // 注册新用户
        const hashedPassword = await bcrypt.hash(password, 10); // 加密密码
        user = await User.create({ email, password: hashedPassword, name: email }); // 创建新用户

        ctx.status = 201;
        ctx.body = {
            message: '注册成功',
            user: { ...user.toJSON(), password: undefined },
        };
    } catch (error) {
        console.error('注册时发生错误:', error);
        ctx.status = 500;
        ctx.body = { message: '服务器错误' };
    }
};

const login = async (ctx) => {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
        ctx.status = 400;
        ctx.body = { message: '邮箱和密码不能为空' };
        return;
    }

    try {
        // 检查用户是否已存在
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            ctx.status = 400;
            ctx.body = { message: '用户不存在，请注册账号' };
            return;
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            ctx.status = 400;
            ctx.body = { message: '密码错误' };
            return;
        }

        // 生成 token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION_TIME });

        // 记录登录日志
        await LoginLog.create({
            userId: user.id,
            ipAddress: ctx.ip,
            loginTime: new Date(),
            userAgent: ctx.headers['user-agent'] || 'unknown',
        });

        ctx.status = 200;
        ctx.body = {
            message: '登录成功',
            user: { ...user.toJSON(), password: undefined },
            token
        };
    } catch (error) {
        console.error('登录时发生错误:', error);
        ctx.status = 500;
        ctx.body = { message: '服务器错误' };
    }
};

module.exports = {
    loginOrRegister,
    register,
    login
};