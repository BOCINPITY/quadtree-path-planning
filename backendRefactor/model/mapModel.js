const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');
const User = require('./userModel'); // Import the User model

const Map = sequelize.define('Map', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    width: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    height: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    startPoint: {
        type: DataTypes.JSON, // Object with {x, y}
        allowNull: false,
    },
    endPoint: {
        type: DataTypes.JSON, // Object with {x, y}
        allowNull: false,
    },
    obstacles: {
        type: DataTypes.JSON, // Store array of objects as JSON
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Reference the User model
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
}, {
    timestamps: true, // Ensure timestamps are enabled
});

module.exports = Map;