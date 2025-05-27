module.exports = {
    JWT_SECRET: 'replace-this-in-production', // JWT 密钥
    TOKEN_EXPIRATION_TIME: '7d', // token 过期时间
    DB_CONFIG: {
        host: 'localhost',
        port: 3305,
        user:'',
        password:'',
        database:'cles_dev',
    },
    EMAIL: {
        host: 'smtp.qq.com', // SMTP服务器地址
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: '', // 发件人邮箱
            pass: '' // 邮箱授权码（不是邮箱密码）
        }
    }
}