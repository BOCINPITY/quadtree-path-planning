const sequelize = require('./utils/db');
const User = require('./model/userModel');
const Map = require('./model/mapModel');
const LoginLog = require('./model/loginLogModel');

const syncModels = async () => {
    try {
        console.info('模型正在同步...');
        // Disable logging
        await sequelize.sync({ alter: true, logging: false });
        console.info('模型同步完成！！！');
    } catch (error) {
        console.error('模型同步失败', error);
    }
};

syncModels();