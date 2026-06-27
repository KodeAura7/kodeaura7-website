import { Router } from 'express';
import {
  bulkStatus as bulkContactStatus,
  exportCsv as exportContacts,
  getOne as getContact,
  list as listContacts,
  remove as removeContact,
  updateStatus as updateContactStatus
} from '../controllers/adminContactController.js';
import { exportCsv as exportNewsletter, list as listNewsletter, remove as removeNewsletter } from '../controllers/adminNewsletterController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { adminList as listTestimonials, exportCsv as exportTestimonials, importCsv as importTestimonials, updateSortOrder as updateTestimonialOrder, updateVisibility as updateTestimonialVisibility } from '../controllers/testimonialsController.js';
import { adminCreate as createService, adminDelete as deleteService, adminExportCsv as exportServicesCsv, adminGetHistory as getServiceHistory, adminGetOne as getService, adminImportCsv as importServicesCsv, adminListAll as listServices, adminSetEnabled as setServiceEnabled, adminSetOrder as setServiceOrder, adminUpdate as updateService } from '../controllers/servicesController.js';
import { adminCreate as createSocialLink, adminDelete as deleteSocialLink, adminExportCsv as exportSocialLinksCsv, adminListAll as listSocialLinks, adminSetEnabled as setSocialLinkEnabled, adminUpdate as updateSocialLink } from '../controllers/socialLinksController.js';
import { adminGetPage, adminSetPage } from '../controllers/pageContentController.js';
import { create as createUser, list as listUsers, remove as removeUser, rollup as userRollup, update as updateUser } from '../controllers/usersController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

router.get('/dashboard', asyncHandler(getDashboard));

router.get('/contacts', asyncHandler(listContacts));
router.get('/contacts/export', asyncHandler(exportContacts));
router.get('/contacts/:id', asyncHandler(getContact));
router.patch('/contacts/bulk-status', asyncHandler(bulkContactStatus));
router.patch('/contacts/:id/status', asyncHandler(updateContactStatus));
router.delete('/contacts/:id', asyncHandler(removeContact));

router.get('/newsletter', asyncHandler(listNewsletter));
router.get('/newsletter/export', asyncHandler(exportNewsletter));
router.delete('/newsletter/:id', asyncHandler(removeNewsletter));

router.get('/testimonials', asyncHandler(listTestimonials));
router.get('/testimonials/export', asyncHandler(exportTestimonials));
router.post('/testimonials/import', asyncHandler(importTestimonials));
router.patch('/testimonials/:id/visibility', asyncHandler(updateTestimonialVisibility));
router.patch('/testimonials/:id/order', asyncHandler(updateTestimonialOrder));

router.get('/services', asyncHandler(listServices));
router.post('/services', asyncHandler(createService));
router.get('/services/export', asyncHandler(exportServicesCsv));
router.post('/services/import', asyncHandler(importServicesCsv));
router.get('/services/:id/history', asyncHandler(getServiceHistory));
router.get('/services/:id', asyncHandler(getService));
router.put('/services/:id', asyncHandler(updateService));
router.delete('/services/:id', asyncHandler(deleteService));
router.patch('/services/:id/enabled', asyncHandler(setServiceEnabled));
router.patch('/services/:id/order', asyncHandler(setServiceOrder));

router.get('/social-links', asyncHandler(listSocialLinks));
router.post('/social-links', asyncHandler(createSocialLink));
router.get('/social-links/export', asyncHandler(exportSocialLinksCsv));
router.put('/social-links/:id', asyncHandler(updateSocialLink));
router.delete('/social-links/:id', asyncHandler(deleteSocialLink));
router.patch('/social-links/:id/enabled', asyncHandler(setSocialLinkEnabled));

router.get('/pages/:page', asyncHandler(adminGetPage));
router.put('/pages/:page', asyncHandler(adminSetPage));

router.get('/users/rollup', asyncHandler(userRollup));
router.get('/users', asyncHandler(listUsers));
router.post('/users', authorize('super_admin'), asyncHandler(createUser));
router.put('/users/:id', authorize('super_admin'), asyncHandler(updateUser));
router.delete('/users/:id', authorize('super_admin'), asyncHandler(removeUser));

export default router;
