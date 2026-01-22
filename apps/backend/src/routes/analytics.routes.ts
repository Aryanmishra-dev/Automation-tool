import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/posts/:postId', analyticsController.getPostAnalytics);
router.get('/performance', analyticsController.getPerformance);

export default router;
