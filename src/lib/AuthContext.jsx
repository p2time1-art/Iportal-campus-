import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const response = await authApi.me();
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error.status && error.status !== 401
        ? { type: 'api_error', message: error.message }
        : null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
    const clearInvalidSession = () => {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError(null);
    };

    window.addEventListener('iportal:unauthorized', clearInvalidSession);
    return () => window.removeEventListener('iportal:unauthorized', clearInvalidSession);
  }, [checkUserAuth]);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
    setIsAuthenticated(true);
    setAuthChecked(true);
    setAuthError(null);
    return response;
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAuthError(null);
    }

    if (shouldRedirect) {
      window.location.assign('/login');
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    window.location.assign('/login');
  }, []);

  const checkAppState = checkUserAuth;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      login,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
