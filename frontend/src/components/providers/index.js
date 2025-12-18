/**
 * Multi-Provider Components
 *
 * Foundation for scaling from solo to multi-provider practice:
 * - Provider profiles and management
 * - Role-based access control (RBAC)
 * - Permission guards for UI/routes
 * - Provider-specific filtering
 */

// Provider Management
export {
  default as ProviderManagement,
  ProviderCard,
  ProviderForm,
  ProviderSelector,
  WorkingHoursEditor,
  ROLES,
  PERMISSIONS,
  SPECIALTIES,
  CALENDAR_COLORS,
} from './ProviderManagement';

// Permissions & RBAC
export {
  default as usePermissions,
  PermissionsProvider,
  PermissionGuard,
  RoleGuard,
  AdminOnly,
  PractitionerOnly,
  filterByPermission,
  createNavItems,
  // Permission constants
  CAN_VIEW_PATIENTS,
  CAN_EDIT_PATIENTS,
  CAN_CREATE_PATIENTS,
  CAN_DELETE_PATIENTS,
  CAN_VIEW_APPOINTMENTS,
  CAN_EDIT_APPOINTMENTS,
  CAN_CREATE_APPOINTMENTS,
  CAN_DELETE_APPOINTMENTS,
  CAN_VIEW_NOTES,
  CAN_EDIT_NOTES,
  CAN_CREATE_NOTES,
  CAN_VIEW_BILLING,
  CAN_CREATE_BILLING,
  CAN_VIEW_REPORTS,
  CAN_MANAGE_SETTINGS,
  CAN_MANAGE_PROVIDERS,
} from './usePermissions';
