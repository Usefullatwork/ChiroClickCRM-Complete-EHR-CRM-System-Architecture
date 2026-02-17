/**
 * Permissions Hook
 *
 * Role-based access control for multi-provider support:
 * - Check user permissions
 * - Conditional rendering based on role
 * - Permission guards for routes/actions
 */

import { useMemo, useCallback, createContext, useContext } from 'react';
import { ROLES, PERMISSIONS } from './ProviderManagement';

// =============================================================================
// CONTEXT
// =============================================================================

const PermissionsContext = createContext(null);

/**
 * Permissions Provider
 */
export function PermissionsProvider({ children, currentUser }) {
  const userRole = currentUser?.role || 'STAFF';
  const rolePermissions = useMemo(() => ROLES[userRole]?.permissions || [], [userRole]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permission) => {
      if (rolePermissions.includes('all')) {
        return true;
      }
      return rolePermissions.includes(permission);
    },
    [rolePermissions]
  );

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback(
    (permissions) => {
      if (rolePermissions.includes('all')) {
        return true;
      }
      return permissions.some((p) => rolePermissions.includes(p));
    },
    [rolePermissions]
  );

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback(
    (permissions) => {
      if (rolePermissions.includes('all')) {
        return true;
      }
      return permissions.every((p) => rolePermissions.includes(p));
    },
    [rolePermissions]
  );

  // Check if user is admin
  const isAdmin = userRole === 'ADMIN';

  // Check if user is practitioner or higher
  const isPractitioner = userRole === 'ADMIN' || userRole === 'PRACTITIONER';

  // Get all permissions for current role
  const permissions = useMemo(() => {
    if (rolePermissions.includes('all')) {
      return Object.keys(PERMISSIONS);
    }
    return rolePermissions;
  }, [rolePermissions]);

  const value = {
    currentUser,
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isPractitioner,
  };

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    // Return default permissions if no provider (solo mode)
    return {
      currentUser: null,
      userRole: 'ADMIN',
      permissions: Object.keys(PERMISSIONS),
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      isAdmin: true,
      isPractitioner: true,
    };
  }
  return context;
}

// =============================================================================
// PERMISSION GUARD COMPONENT
// =============================================================================

/**
 * Conditionally render children based on permission
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? children : fallback;
  }

  // Multiple permissions check
  if (permissions) {
    const hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    return hasAccess ? children : fallback;
  }

  return children;
}

/**
 * Role-based guard
 */
export function RoleGuard({ children, roles, fallback = null }) {
  const { userRole } = usePermissions();

  if (Array.isArray(roles)) {
    return roles.includes(userRole) ? children : fallback;
  }

  return userRole === roles ? children : fallback;
}

/**
 * Admin-only guard
 */
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = usePermissions();
  return isAdmin ? children : fallback;
}

/**
 * Practitioner or Admin guard
 */
export function PractitionerOnly({ children, fallback = null }) {
  const { isPractitioner } = usePermissions();
  return isPractitioner ? children : fallback;
}

// =============================================================================
// PERMISSION UTILITIES
// =============================================================================

/**
 * Filter items based on user permissions
 */
export function filterByPermission(items, permissionKey, userPermissions) {
  return items.filter((item) => {
    const required = item[permissionKey];
    if (!required) {
      return true;
    }
    if (userPermissions.includes('all')) {
      return true;
    }
    if (Array.isArray(required)) {
      return required.some((p) => userPermissions.includes(p));
    }
    return userPermissions.includes(required);
  });
}

/**
 * Create permission-aware navigation items
 */
export function createNavItems(items, lang = 'en') {
  return items.map((item) => ({
    ...item,
    label: typeof item.label === 'object' ? item.label[lang] : item.label,
  }));
}

// =============================================================================
// COMMON PERMISSION CHECKS
// =============================================================================

export const CAN_VIEW_PATIENTS = 'patients.view';
export const CAN_EDIT_PATIENTS = 'patients.edit';
export const CAN_CREATE_PATIENTS = 'patients.create';
export const CAN_DELETE_PATIENTS = 'patients.delete';

export const CAN_VIEW_APPOINTMENTS = 'appointments.view';
export const CAN_EDIT_APPOINTMENTS = 'appointments.edit';
export const CAN_CREATE_APPOINTMENTS = 'appointments.create';
export const CAN_DELETE_APPOINTMENTS = 'appointments.delete';

export const CAN_VIEW_NOTES = 'notes.view';
export const CAN_EDIT_NOTES = 'notes.edit';
export const CAN_CREATE_NOTES = 'notes.create';

export const CAN_VIEW_BILLING = 'billing.view';
export const CAN_CREATE_BILLING = 'billing.create';

export const CAN_VIEW_REPORTS = 'reports.view';
export const CAN_MANAGE_SETTINGS = 'settings.edit';
export const CAN_MANAGE_PROVIDERS = 'providers.manage';

export default usePermissions;
