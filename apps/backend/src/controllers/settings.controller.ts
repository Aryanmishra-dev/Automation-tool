import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export async function getAllSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.settings.findMany();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function getSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    next(error);
  }
}

export async function updateSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    res.json(setting);
  } catch (error) {
    next(error);
  }
}
