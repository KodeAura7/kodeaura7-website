import { Router } from 'express';
import { myContacts, newsletterStatus, newsletterSubscribe, newsletterUnsubscribe } from '../controllers/customerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/contacts', asyncHandler(myContacts));

router.get('/newsletter', asyncHandler(newsletterStatus));
router.post('/newsletter', asyncHandler(newsletterSubscribe));
router.delete('/newsletter', asyncHandler(newsletterUnsubscribe));

export default router;
