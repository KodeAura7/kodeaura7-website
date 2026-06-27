import { Router } from 'express';
import {
  publicList,
  myTestimonials,
  submit,
  updateOwn,
  deleteOwn
} from '../controllers/testimonialsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(publicList));
router.get('/mine', authenticate, asyncHandler(myTestimonials));
router.post('/', authenticate, asyncHandler(submit));
router.patch('/:id', authenticate, asyncHandler(updateOwn));
router.delete('/:id', authenticate, asyncHandler(deleteOwn));

export default router;
