import { Router, Request, Response, NextFunction } from 'express';
import ContentService from '../services/content.service';
import { validate, generateContentSchema } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Generate content from URL
router.post(
  '/generate',
  validate(generateContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, platforms, tone, includeHashtags, maxHashtags } = req.body;

      const generated = await ContentService.generateFromUrl(url, {
        platforms,
        tone,
        includeHashtags,
        maxHashtags,
      });

      res.json({
        success: true,
        data: generated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate content from trends
router.post(
  '/generate-from-trends',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { platforms, limit } = req.body;

      const generated = await ContentService.generateFromTrends(
        platforms || ['TWITTER', 'LINKEDIN'],
        limit || 5
      );

      res.json({
        success: true,
        data: generated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Improve existing content
const improveContentSchema = z.object({
  body: z.object({
    instructions: z.string().min(1).max(500),
  }),
});

router.post(
  '/improve/:postId',
  validate(improveContentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId } = req.params;
      const { instructions } = req.body;

      const improved = await ContentService.improveContent(postId, instructions);

      res.json({
        success: true,
        data: improved,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get content suggestions
router.get(
  '/suggestions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const suggestions = await ContentService.getContentSuggestions();

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create posts from generated content
const createPostsSchema = z.object({
  body: z.object({
    content: z.array(z.object({
      platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM']),
      content: z.string(),
      hashtags: z.array(z.string()).optional(),
      mediaUrl: z.string().url().optional(),
    })),
    sourceUrl: z.string().url().optional(),
    scheduledFor: z.string().datetime().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED']).optional(),
  }),
});

router.post(
  '/create-posts',
  validate(createPostsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { content, sourceUrl, scheduledFor, status } = req.body;

      const posts = await ContentService.createPosts(content, {
        sourceUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        status,
      });

      res.status(201).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
