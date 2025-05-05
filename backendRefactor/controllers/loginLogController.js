const LoginLog = require('../model/loginLogModel');

const getLoginLogs = async (ctx) => {
    console.log(ctx.query);
    try {
        const { page = 1, limit = 10, id } = ctx.query; // 获取分页参数和用户 ID

        // 确保 page 和 limit 是有效数字
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        const offset = (pageNumber - 1) * limitNumber; // 计算跳过的记录数

        // 构建查询条件
        const whereCondition = id ? { userId:id } : {};

        const total = await LoginLog.count({ where: whereCondition }); // 获取总记录数
        const logs = await LoginLog.findAll({ // 查询登录日志
            where: whereCondition,
            offset,
            limit: limitNumber,
        });

        ctx.body = {
            code: 200,
            message: '获取登录日志成功',
            data: {
                total,
                logs,
            },
        };
    } catch (error) {
        ctx.body = {
            code: 500,
            message: '获取登录日志失败',
            error: error.message,
        };
    }
};

module.exports = {
    getLoginLogs,
};