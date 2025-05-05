const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

// 定义用户模型
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER, // 整数类型
        autoIncrement: true, // 自动递增
        primaryKey: true, // 主键
    },
    name: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: false, // 不允许为空
    },
    email: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: false, // 不允许为空
        unique: true, // 唯一约束
    },
    password: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: false, // 不允许为空
    },
    avatar: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: true, // 允许为空
        defaultValue: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', // 默认值
    },
    bio: {
        type: DataTypes.TEXT, // 文本类型
        allowNull: true, // 允许为空
    },
    address: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: true, // 允许为空
    },
    field: {
        type: DataTypes.STRING, // 字符串类型
        allowNull: true, // 允许为空
    },
    birthday: {
        type: DataTypes.DATE, // 日期类型
        allowNull: true, // 允许为空
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'), // 枚举类型
        allowNull: true, // 允许为空
        defaultValue: 'other', // 默认值
    },
}, {
    timestamps: true, // 自动添加创建和更新时间戳
});

module.exports = User;

