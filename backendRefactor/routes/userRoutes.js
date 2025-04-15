const Router = require('koa-router');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticateToken'); // 引入 authenticateToken 中间件
const router = new Router({ prefix: '/users' });
router.post('/', authenticateToken, userController.createUser);
router.get('/', authenticateToken, userController.getUsers); // 为 getUsers 路由添加中间件
router.get('/:id', authenticateToken, userController.getUserById);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);
module.exports = router;