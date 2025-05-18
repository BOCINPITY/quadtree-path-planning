const Router = require('koa-router');
const quadTreeController = require('../controllers/quadTreeController');
const authenticateToken = require('../middleware/authenticateToken'); // 引入 authenticateToken 中间件
const router = new Router({ prefix: '/quadtree' });
router.post('/id', authenticateToken, quadTreeController.createQuadTree);

module.exports = router;
