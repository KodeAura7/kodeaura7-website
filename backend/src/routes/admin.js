import { Router } from 'express';
import { exportCsv as exportContacts, list as listContacts, remove as removeContact } from '../controllers/adminContactController.js';
import { exportCsv as exportNewsletter, list as listNewsletter, remove as removeNewsletter } from '../controllers/adminNewsletterController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { create as createUser, list as listUsers, remove as removeUser, update as updateUser } from '../controllers/usersController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(getDashboard));

router.get('/contacts', asyncHandler(listContacts));
router.get('/contacts/export', asyncHandler(exportContacts));
router.delete('/contacts/:id', asyncHandler(removeContact));

router.get('/newsletter', asyncHandler(listNewsletter));
router.get('/newsletter/export', asyncHandler(exportNewsletter));
router.delete('/newsletter/:id', asyncHandler(removeNewsletter));

router.get('/users', authorize('super_admin'), asyncHandler(listUsers));
router.post('/users', authorize('super_admin'), asyncHandler(createUser));
router.put('/users/:id', authorize('super_admin'), asyncHandler(updateUser));
router.delete('/users/:id', authorize('super_admin'), asyncHandler(removeUser));

export default router;
