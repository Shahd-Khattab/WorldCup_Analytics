const { Router } = require('express');
const analyticsconn = require('../controllers/controller');

const analyticsRouter = Router();

analyticsRouter.post('/analytics/add', analyticsconn.addData);
analyticsRouter.get('/analytics/get', analyticsconn.getData);
analyticsRouter.post('/analytics/add/stats', analyticsconn.stats);
analyticsRouter.get('/analytics/get/stats', analyticsconn.getStats);

module.exports=analyticsRouter;