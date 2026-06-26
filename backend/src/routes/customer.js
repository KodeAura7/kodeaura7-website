import { Router } from 'express';
import { myContacts } from '../controllers/customerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/contacts', asyncHandler(myContacts));

export default router;
