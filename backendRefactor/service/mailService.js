const nodemailer = require('nodemailer');
const {EMAIL} = require('../config')
const verificationStore = new Map(); // 用于存储验证码和过期时间
// 创建邮件发送 transporter（以QQ邮箱为例，其他邮箱请查找对应SMTP配置）
const transporter = nodemailer.createTransport({
    host: EMAIL.host, // SMTP服务器地址
    port: EMAIL.port,
    secure: EMAIL.secure, // true for 465, false for other ports
    auth: {
        user: EMAIL.auth.user, // 发件人邮箱
        pass: EMAIL.auth.pass // 邮箱授权码（不是邮箱密码）
    }
});
/**
 * 
 * @description 设置验证码和过期时间
 * @param {string} email 
 * @param {string} code 
 */
const setVerificationCode = (email, code) => {
    const expirationTime = Date.now() + 5 * 60 * 1000; // 5分钟后过期
    verificationStore.set(email, { code, expirationTime });
}
/**
 * 
 * @param {string} email 
 * @param {string} code 
 * @returns {boolean} 验证码是否正确
 * @description 验证验证码是否正确
 */

const verifyCode = (email, code) => {
    const record = verificationStore.get(email);
    if (!record) {
        return false; // 没有记录
    }
    if (Date.now() > record.expirationTime) {
        verificationStore.delete(email); // 删除过期记录
        return false; // 验证码已过期
    }
    if (record.code === code) {
        verificationStore.delete(email); // 验证成功后删除记录
        return true; // 验证成功
    }
    return false; // 验证失败
}


/**
 * @description 生成6位随机验证码
 * @returns {string} 生成6位随机验证码
 */
const generateVerificationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
/**
 * 发送验证码邮件
 * @param {string} to 收件人邮箱
 * @param {string} code 验证码
 * @returns {Promise} 发送邮件的Promise对象
 */
async function sendVerificationCode(to,code) {
    const mailOptions = {
        from: `"四叉树路径规划演示系统" <${EMAIL.auth.user}>`, // 发件人地址
        to,
        subject: '您的验证码',
        text: `您的验证码是：${code}，请在5分钟内完成验证。`,
        html: `<b>您的验证码是：<span style="color:blue">${code}</span></b>，请在5分钟内完成验证。`
    };
    const res = transporter.sendMail(mailOptions);
    setVerificationCode(to, code); // 设置验证码和过期时间
    return res;
}

module.exports = {
    sendVerificationCode,
    generateVerificationCode,
    setVerificationCode,
    verifyCode
};