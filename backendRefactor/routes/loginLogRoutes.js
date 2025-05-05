const Router = require('koa-router');
const loginLogController = require('../controllers/loginLogController');
const authenticateToken = require('../middleware/authenticateToken'); // 引入 authenticateToken 中间件
const router = new Router({ prefix: '/loginLogs' });

router.get('/', loginLogController.getLoginLogs); // 为 getUsers 路由添加中间件


module.exports = router;