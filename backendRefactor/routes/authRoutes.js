const Router = require('koa-router');
const authController = require('../controllers/authController');
const router = new Router({ prefix: '/auth/login' });
router.post('/', authController.loginOrRegister);

module.exports = router;
