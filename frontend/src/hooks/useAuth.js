/**
 * Authentication Hook
 * Wraps Clerk authentication with app-specific logic
 */

import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { isLoaded, userId, signOut } = useClerkAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  // Get user metadata
  const role = user?.publicMetadata?.role || 'PRACTITIONER';
  const organizationId = user?.publicMetadata?.organizationId;
  const twoFactorEnabled = user?.twoFactorEnabled || false;

  // Check if user is admin
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role);

  // Check 2FA requirement for admin users
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Admin users MUST have 2FA enabled
    if (isAdmin && !twoFactorEnabled) {
      navigate('/settings/security/2fa');
    }
  }, [isLoaded, user, isAdmin, twoFactorEnabled, navigate]);

  // Store organization ID in localStorage for API calls
  useEffect(() => {
    if (organizationId) {
      localStorage.setItem('organizationId', organizationId);
    }
  }, [organizationId]);

  const hasPermission = (requiredRoles) => {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(role);
  };

  return {
    isLoaded,
    isSignedIn: !!userId,
    userId,
    user,
    role,
    organizationId,
    twoFactorEnabled,
    isAdmin,
    hasPermission,
    signOut
  };
};

export default useAuth;
