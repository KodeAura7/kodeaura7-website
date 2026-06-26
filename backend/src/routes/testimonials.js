import { Router } from 'express';
import { myTestimonial, publicList, submit } from '../controllers/testimonialsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(publicList));
router.get('/mine', authenticate, asyncHandler(myTestimonial));
router.post('/', authenticate, asyncHandler(submit));

export default router;
