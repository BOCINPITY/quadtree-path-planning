const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('../config');

const sequelize = new Sequelize(DB_CONFIG.database, DB_CONFIG.user, DB_CONFIG.password, {
    host: DB_CONFIG.host,
    dialect: 'mysql',
    port: DB_CONFIG.port,
});

module.exports = sequelize;