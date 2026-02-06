/**
 * Authentication Hook
 * Local session-based authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  // Fetch current user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        }
      } catch (err) {
        // Not logged in
      }
      setIsLoaded(true);
    };
    checkAuth();
  }, []);

  const role = user?.role || 'PRACTITIONER';
  const organizationId = user?.organization_id || user?.organizationId;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role);

  const hasPermission = useCallback((requiredRoles) => {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(role);
  }, [role]);

  const signOut = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Continue even if logout API fails
    }
    setUser(null);
    navigate('/');
  }, [navigate]);

  return {
    isLoaded,
    isSignedIn: !!user,
    userId: user?.id,
    user,
    role,
    organizationId,
    isAdmin,
    hasPermission,
    signOut
  };
};

export default useAuth;
