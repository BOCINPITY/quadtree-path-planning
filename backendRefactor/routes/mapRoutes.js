const Router = require('koa-router');
const mapController = require('../controllers/mapController');
const authenticateToken = require('../middleware/authenticateToken'); // 引入 authenticateToken 中间件
const router = new Router({ prefix: '/maps' });
router.get('/open-source', authenticateToken, mapController.getOpenSourceMaps);
router.get('/', authenticateToken, mapController.getAllMaps);
router.get('/:id', authenticateToken, mapController.getMapById);
router.post('/', authenticateToken, mapController.createMap);
router.put('/:id', authenticateToken, mapController.updateMap);
router.delete('/:id', authenticateToken, mapController.deleteMap);


module.exports = router;
