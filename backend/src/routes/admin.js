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
import { adminGetPage, adminGetPageHistory, adminSetPage } from '../controllers/pageContentController.js';
import { listLogoAssets, uploadLogoAsset, uploadMiddleware } from '../controllers/assetsController.js';
import { getPermissions, getMyPermissions, setPermission, bulkSetPermissions } from '../controllers/permissionsController.js';
import { adminGetFields as getContactFormFields, adminUpdateField as updateContactFormField, adminCreateField as createContactFormField, adminDeleteField as deleteContactFormField, adminBulkReorder as reorderContactFormFields } from '../controllers/contactFormController.js';
import { create as createUser, list as listUsers, remove as removeUser, rollup as userRollup, update as updateUser } from '../controllers/usersController.js';
import {
  list as listListViews,
  getOne as getListView,
  create as createListView,
  update as updateListView,
  remove as deleteListView,
  duplicate as duplicateListView,
  makeDefault as setListViewDefault,
  favorite as favoriteListView,
  getFieldConfig as getListViewFields,
} from '../controllers/listViewController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

// Dashboard — open to all admins
router.get('/dashboard', asyncHandler(getDashboard));

// ── Contacts ──────────────────────────────────────────────────────────────────
router.get('/contacts/export', requirePermission('contacts.export'), asyncHandler(exportContacts));
router.get('/contacts',        requirePermission('contacts.view'),   asyncHandler(listContacts));
router.get('/contacts/:id',    requirePermission('contacts.view'),   asyncHandler(getContact));
router.patch('/contacts/bulk-status', requirePermission('contacts.status_update'), asyncHandler(bulkContactStatus));
router.patch('/contacts/:id/status',  requirePermission('contacts.status_update'), asyncHandler(updateContactStatus));
router.delete('/contacts/:id', requirePermission('contacts.delete'), asyncHandler(removeContact));

// ── Newsletter ────────────────────────────────────────────────────────────────
router.get('/newsletter/export', requirePermission('newsletter.export'), asyncHandler(exportNewsletter));
router.get('/newsletter',        requirePermission('newsletter.view'),   asyncHandler(listNewsletter));
router.delete('/newsletter/:id', requirePermission('newsletter.delete'), asyncHandler(removeNewsletter));

// ── Testimonials ──────────────────────────────────────────────────────────────
router.get('/testimonials/export', requirePermission('testimonials.view'), asyncHandler(exportTestimonials));
router.get('/testimonials',        requirePermission('testimonials.view'), asyncHandler(listTestimonials));
router.post('/testimonials/import',       requirePermission('testimonials.edit'), asyncHandler(importTestimonials));
router.patch('/testimonials/:id/visibility', requirePermission('testimonials.edit'), asyncHandler(updateTestimonialVisibility));
router.patch('/testimonials/:id/order',      requirePermission('testimonials.edit'), asyncHandler(updateTestimonialOrder));

// ── Services ──────────────────────────────────────────────────────────────────
router.get('/services/export',    requirePermission('services.view'),   asyncHandler(exportServicesCsv));
router.post('/services/import',   requirePermission('services.edit'),   asyncHandler(importServicesCsv));
router.get('/services/:id/history', requirePermission('services.view'), asyncHandler(getServiceHistory));
router.get('/services/:id',       requirePermission('services.view'),   asyncHandler(getService));
router.put('/services/:id',       requirePermission('services.edit'),   asyncHandler(updateService));
router.delete('/services/:id',    requirePermission('services.delete'), asyncHandler(deleteService));
router.patch('/services/:id/enabled', requirePermission('services.edit'), asyncHandler(setServiceEnabled));
router.patch('/services/:id/order',   requirePermission('services.edit'), asyncHandler(setServiceOrder));
router.get('/services',           requirePermission('services.view'),   asyncHandler(listServices));
router.post('/services',          requirePermission('services.edit'),   asyncHandler(createService));

// ── Social Links ──────────────────────────────────────────────────────────────
router.get('/social-links/export', requirePermission('social_links.view'),   asyncHandler(exportSocialLinksCsv));
router.get('/social-links',        requirePermission('social_links.view'),   asyncHandler(listSocialLinks));
router.post('/social-links',       requirePermission('social_links.edit'),   asyncHandler(createSocialLink));
router.put('/social-links/:id',    requirePermission('social_links.edit'),   asyncHandler(updateSocialLink));
router.delete('/social-links/:id', requirePermission('social_links.delete'), asyncHandler(deleteSocialLink));
router.patch('/social-links/:id/enabled', requirePermission('social_links.edit'), asyncHandler(setSocialLinkEnabled));

// ── Assets ────────────────────────────────────────────────────────────────────
router.get('/assets/logos',  asyncHandler(listLogoAssets));
router.post('/assets/logos', requirePermission('branding.edit'), uploadMiddleware, asyncHandler(uploadLogoAsset));

// ── Page content ──────────────────────────────────────────────────────────────
router.get('/pages/:page/history', asyncHandler(adminGetPageHistory));
router.get('/pages/:page',         asyncHandler(adminGetPage));
// Dynamic permission: about → about.edit, branding → branding.edit
router.put('/pages/:page', asyncHandler(async (req, res, next) => {
  const page = req.params.page;
  const actionMap = { about: 'about.edit', branding: 'branding.edit' };
  const action = actionMap[page];
  if (action) {
    const role = req.user?.role;
    if (role !== 'super_admin') {
      const { isPermitted } = await import('../services/permissionsService.js');
      const ok = await isPermitted(role, action);
      if (!ok) return res.status(403).json({ message: `You do not have permission to edit the ${page} page.` });
    }
  }
  return adminSetPage(req, res, next);
}));

// ── Permissions (super_admin only) ────────────────────────────────────────────
router.get('/permissions/my',  asyncHandler(getMyPermissions));
router.get('/permissions',     authorize('super_admin'), asyncHandler(getPermissions));
router.put('/permissions/bulk', authorize('super_admin'), asyncHandler(bulkSetPermissions));
router.put('/permissions',      authorize('super_admin'), asyncHandler(setPermission));

// ── Contact Form ──────────────────────────────────────────────────────────────
router.get('/contact-form',         asyncHandler(getContactFormFields));
router.post('/contact-form/reorder', requirePermission('contact_form.edit'), asyncHandler(reorderContactFormFields));
router.post('/contact-form',         requirePermission('contact_form.edit'), asyncHandler(createContactFormField));
router.put('/contact-form/:id',      requirePermission('contact_form.edit'), asyncHandler(updateContactFormField));
router.delete('/contact-form/:id',   requirePermission('contact_form.edit'), asyncHandler(deleteContactFormField));

// ── List Views ────────────────────────────────────────────────────────────────
router.get('/list-views/fields',           asyncHandler(getListViewFields));
router.get('/list-views',                  asyncHandler(listListViews));
router.post('/list-views',                 asyncHandler(createListView));
router.get('/list-views/:id',              asyncHandler(getListView));
router.put('/list-views/:id',              asyncHandler(updateListView));
router.delete('/list-views/:id',           asyncHandler(deleteListView));
router.post('/list-views/:id/duplicate',   asyncHandler(duplicateListView));
router.patch('/list-views/:id/default',    asyncHandler(setListViewDefault));
router.patch('/list-views/:id/favorite',   asyncHandler(favoriteListView));

// ── Users (super_admin only) ──────────────────────────────────────────────────
router.get('/users/rollup', asyncHandler(userRollup));
router.get('/users',        asyncHandler(listUsers));
router.post('/users',   authorize('super_admin'), asyncHandler(createUser));
router.put('/users/:id',   authorize('super_admin'), asyncHandler(updateUser));
router.delete('/users/:id', authorize('super_admin'), asyncHandler(removeUser));

export default router;
