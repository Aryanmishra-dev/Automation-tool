import { Router } from 'express';
import * as feedsController from '../controllers/feeds.controller';

const router = Router();

router.get('/', feedsController.getAllFeeds);
router.post('/', feedsController.createFeed);
router.get('/:id', feedsController.getFeedById);
router.put('/:id', feedsController.updateFeed);
router.delete('/:id', feedsController.deleteFeed);
router.post('/:id/fetch', feedsController.fetchFeed);

export default router;
