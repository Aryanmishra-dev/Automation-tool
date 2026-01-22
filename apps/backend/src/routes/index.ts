import { Router } from 'express';
import feedsRoutes from './feeds.routes';
import postsRoutes from './posts.routes';
import trendsRoutes from './trends.routes';
import analyticsRoutes from './analytics.routes';
import settingsRoutes from './settings.routes';
import contentRoutes from './content.routes';
import queueRoutes from './queue.routes';

const router = Router();

router.use('/feeds', feedsRoutes);
router.use('/posts', postsRoutes);
router.use('/trends', trendsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/content', contentRoutes);
router.use('/queue', queueRoutes);

export default router;
