
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, UserRegistrationData } from '../types';
import * as authService from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const UNAUTHORIZED_EVENT = 'global-unauthorized';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const handleLogout = useCallback(async (isSessionExpired = false) => {
    setIsLoading(true);
    const token = authService.getAuthToken();
    try {
      if (token) {
        // Attempt backend logout, but don't let it block frontend logout
        await authService.logoutUser(token).catch(err => console.warn("Backend logout failed, proceeding with local logout:", err.message));
      }
    } finally {
      setCurrentUser(null);
      authService.removeAuthToken();
      if (isSessionExpired) {
        addToast('error', 'Session Expired', 'Your session has expired. Please log in again.');
      } else {
        addToast('info', 'Logged Out', 'You have been successfully logged out.');
      }
      setIsLoading(false);
      // Navigation will be handled by ProtectedRoute or component logic after currentUser becomes null
    }
  }, [addToast]);


  const loadUserFromToken = useCallback(async () => {
    const token = authService.getAuthToken();
    if (token) {
      try {
        const user = await authService.fetchCurrentUserData(token);
        setCurrentUser(user);
      } catch (error: any) {
        console.warn("Failed to fetch user with stored token:", error.message);
        // If fetching user fails with 401, it will dispatch 'global-unauthorized'
        // which will be caught by the event listener below, triggering handleLogout.
        // So, direct call to handleLogout here might be redundant if error is 401.
        // However, for other errors, or if token is just invalid locally, we still clear it.
        if (error.message?.includes('401') || error.message?.toLowerCase().includes('unauthorized')) {
          // The event listener will handle this.
        } else {
          authService.removeAuthToken(); 
          setCurrentUser(null);
        }
      }
    }
    setIsLoading(false);
  }, []); 

  useEffect(() => {
    setIsLoading(true);
    loadUserFromToken();

    const handleUnauthorized = () => {
      console.warn("Global unauthorized event received. Logging out.");
      handleLogout(true); // Pass true to indicate session expiration message
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [loadUserFromToken, handleLogout]);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const tokenResponse = await authService.loginUser(username, password);
      authService.setAuthToken(tokenResponse.access_token);
      const user = await authService.fetchCurrentUserData(tokenResponse.access_token);
      setCurrentUser(user);
      addToast('success', 'Login Successful', `Welcome back, ${user.username}!`);
    } catch (error: any) {
      setCurrentUser(null);
      authService.removeAuthToken();
      console.error("Login error:", error.message);
      addToast('error', 'Login Failed', error.message || "Invalid username or password.");
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserRegistrationData): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await authService.registerUser(userData);
      addToast('success', 'Registration Successful', `User ${newUser.username} created.`);
      return newUser;
    } catch (error: any) {
      console.error("Registration error:", error.message);
      addToast('error', 'Registration Failed', error.message || "Could not register user.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout: () => handleLogout(false), register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
