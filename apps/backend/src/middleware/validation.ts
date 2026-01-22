import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Zod validation middleware factory
 */
export function validate<T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
        });
      }
      next(error);
    }
  };
}

// ============ Validation Schemas ============

// Feed schemas
export const createFeedSchema = z.object({
  url: z.string().url('Invalid URL format'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateFeedSchema = createFeedSchema.partial();

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM']),
  scheduledFor: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  feedId: z.string().cuid().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const schedulePostSchema = z.object({
  scheduledFor: z.string().datetime('Invalid datetime format'),
});

// Content generation schemas
export const generateContentSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  platform: z.enum(['twitter', 'linkedin', 'instagram']),
  context: z.string().max(2000).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export const postQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED']).optional(),
  platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM']).optional(),
});

// Type exports
export type CreateFeedInput = z.infer<typeof createFeedSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
