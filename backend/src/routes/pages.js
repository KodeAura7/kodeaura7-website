import { Router } from 'express';
import { publicGetPage } from '../controllers/pageContentController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:page', asyncHandler(publicGetPage));

export default router;
