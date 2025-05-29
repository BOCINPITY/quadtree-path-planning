const User = require('../model/userModel'); // 引入 User 模型
const LoginLog = require('../model/loginLogModel'); // 引入登录日志模型
const bcrypt = require('bcrypt'); // 用于密码加密
const jwt = require('jsonwebtoken'); // 引入 jsonwebtoken
const { JWT_SECRET, TOKEN_EXPIRATION_TIME } = require('../config'); // 引入配置文件
const codeService = require('../service/mailService'); // 引入验证码服务
const { default: axios } = require('axios');

const register = async (ctx) => {
    const { email,username, password,code } = ctx.request.body;

    if (!email || !password || !username || !code) {
        ctx.status = 400;
        ctx.body = { message: '邮箱、用户名、密码、验证码不能为空' };
        return;
    }
    try {
        // 验证验证码
        const isCodeValid = codeService.verifyCode(email, code);
        if (!isCodeValid) {
            ctx.status = 400;
            ctx.body = { message: '验证码错误或已过期' };
            return;
        }
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
        user = await User.create({ email, password: hashedPassword, name: username }); // 创建新用户
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
        const res = await axios.get(`http://ip-api.com/json/${ctx.ip}`)
        
        // 记录登录日志
        await LoginLog.create({
            userId: user.id,
            ipAddress: res.data.city || '未知ip',
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

const getVerificationCode = async (ctx) => {
    const {email} = ctx.request.body;
    if (!email) {
        ctx.status = 400;
        ctx.body = { message: '邮箱不能为空' };
        return;
    }
    try{
        // 生成验证码
        const code = codeService.generateVerificationCode();
        // 设置验证码和过期时间
        codeService.setVerificationCode(email, code);
        // 发送验证码邮件
        await codeService.sendVerificationCode(email, code);
        ctx.status = 200;
        ctx.body = { message: '验证码已发送到您的邮箱' };
    }catch (error) {
        console.error('获取验证码时发生错误:', error);
        ctx.status = 500;
        ctx.body = { message: '服务器错误' };
    }
}

module.exports = {
    getVerificationCode,
    register,
    login
};