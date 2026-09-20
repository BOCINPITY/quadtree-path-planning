require('dotenv').config();

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'replace-this-in-production',
    TOKEN_EXPIRATION_TIME: process.env.TOKEN_EXPIRATION_TIME || '7d',
    DB_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'quadpath',
    },
    EMAIL: {
        host: process.env.SMTP_HOST || 'smtp.qq.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    },
};
