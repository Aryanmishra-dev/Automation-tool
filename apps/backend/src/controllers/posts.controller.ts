import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { PublisherService } from '../services/publisher.service';

const publisher = new PublisherService();

export async function getAllPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, platform } = req.query;
    const posts = await prisma.post.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(platform && { platform: platform as any }),
      },
      orderBy: { createdAt: 'desc' },
      include: { feed: true, analytics: true },
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await prisma.post.create({
      data: req.body,
    });
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
}

export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { feed: true, analytics: true },
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const post = await prisma.post.update({
      where: { id },
      data: req.body,
    });
    res.json(post);
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function publishPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await publisher.publishPost(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function schedulePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { scheduledFor } = req.body;
    const post = await prisma.post.update({
      where: { id },
      data: {
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
      },
    });
    res.json(post);
  } catch (error) {
    next(error);
  }
}
