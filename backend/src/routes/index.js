import { Router } from 'express';
import { postContact } from '../controllers/contactController.js';
import { getHealth } from '../controllers/healthController.js';
import { postNewsletter } from '../controllers/newsletterController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/health', getHealth);
router.post('/contact', asyncHandler(postContact));
router.post('/newsletter', asyncHandler(postNewsletter));

export default router;
