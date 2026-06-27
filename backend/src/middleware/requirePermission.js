import { isPermitted } from '../services/permissionsService.js';

export function requirePermission(action) {
  return async (req, res, next) => {
    try {
      const role = req.user?.role;
      if (!role) return res.status(401).json({ message: 'Authentication required.' });
      if (role === 'super_admin') return next();

      const ok = await isPermitted(role, action);
      if (!ok) {
        return res.status(403).json({
          message: `You do not have permission to perform this action (${action}).`
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
