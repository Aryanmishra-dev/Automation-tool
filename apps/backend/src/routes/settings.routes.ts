import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

router.get('/', settingsController.getAllSettings);
router.get('/:key', settingsController.getSetting);
router.put('/:key', settingsController.updateSetting);

export default router;
