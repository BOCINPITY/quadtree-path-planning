const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('cles_dev', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3305,
});

module.exports = sequelize;