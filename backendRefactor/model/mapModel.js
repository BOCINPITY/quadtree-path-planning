// 引入 Sequelize 数据类型模块
const { DataTypes } = require('sequelize');
// 引入数据库连接实例
const sequelize = require('../utils/db');
// 引入用户模型
const User = require('./userModel'); // 导入用户模型

// 定义 Map 模型
const Map = sequelize.define('Map', {
    // 主键 ID，自动递增
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // 地图名称，不能为空
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // 地图描述，不能为空
    description: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '无描述',
    },
    // 分割线颜色，不能为空
    dividColor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '#0077ff', // 默认值为蓝色
    },
    // 最小阈值，不能为空
    minThreshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
    },
    // 地图宽度，不能为空
    width: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // 地图高度，不能为空
    height: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // 起点坐标，JSON 格式，{x: number, y: number}
    startPoint: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    // 终点坐标，JSON 格式
    endPoint: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    // 障碍物信息，JSON 格式，不能为空,默认是空数组
    obstacles: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
    },
    isOpenSource: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // 默认不开源
    },
    // 用户 ID，外键，不能为空
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
}, {
    // 启用时间戳，自动生成 createdAt 和 updatedAt 字段
    timestamps: true,
});
Map.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// 导出 Map 模型
module.exports = Map;