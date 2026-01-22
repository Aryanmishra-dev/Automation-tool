import { Router } from 'express';
import * as trendsController from '../controllers/trends.controller';

const router = Router();

router.get('/', trendsController.getTrends);
router.get('/top', trendsController.getTopTrends);
router.post('/analyze', trendsController.analyzeTrends);

export default router;
