const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./userModel'); // 引入用户模型
// 定义登录日志模型
const LoginLog = sequelize.define('LoginLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // 关联到 User 模型
            key: 'id', // 关联的字段为 User 的主键 ID
        },
        onUpdate: 'CASCADE', // 当 User 更新时同步更新
        onDelete: 'CASCADE', // 当 User 删除时同步删除
    },
    loginTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: false, // 不需要 createdAt 和 updatedAt
});

module.exports = LoginLog;