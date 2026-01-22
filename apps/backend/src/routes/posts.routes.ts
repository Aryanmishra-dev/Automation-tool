import { Router } from 'express';
import * as postsController from '../controllers/posts.controller';

const router = Router();

router.get('/', postsController.getAllPosts);
router.post('/', postsController.createPost);
router.get('/:id', postsController.getPostById);
router.put('/:id', postsController.updatePost);
router.delete('/:id', postsController.deletePost);
router.post('/:id/publish', postsController.publishPost);
router.post('/:id/schedule', postsController.schedulePost);

export default router;
