import { usePermissions } from '../../contexts/PermissionsContext';

/**
 * Renders children only when the current user has the given permission.
 * Falls back to `fallback` (default: null) otherwise.
 *
 * Usage:
 *   <PermissionGate action="contacts.delete">
 *     <DeleteButton />
 *   </PermissionGate>
 */
export default function PermissionGate({ action, fallback = null, children }) {
  const { canDo } = usePermissions();
  return canDo(action) ? children : fallback;
}
