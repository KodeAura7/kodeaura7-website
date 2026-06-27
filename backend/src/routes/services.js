import { Router } from 'express';
import { publicList } from '../controllers/servicesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(publicList));

export default router;
