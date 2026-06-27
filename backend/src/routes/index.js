import { Router } from 'express';
import { postContact } from '../controllers/contactController.js';
import { getHealth } from '../controllers/healthController.js';
import { postNewsletter } from '../controllers/newsletterController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import customerRoutes from './customer.js';
import testimonialsRoutes from './testimonials.js';
import servicesRoutes from './services.js';
import socialLinksRoutes from './socialLinks.js';
import pagesRoutes from './pages.js';

const router = Router();

router.get('/health', getHealth);
router.post('/contact', asyncHandler(postContact));
router.post('/newsletter', asyncHandler(postNewsletter));

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/customer', customerRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/services', servicesRoutes);
router.use('/social-links', socialLinksRoutes);
router.use('/pages', pagesRoutes);

export default router;
