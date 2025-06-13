
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthContextType, UserRegistrationData } from '../types'; // Assuming this resolves to the root types.ts
import * as authService from '../src/services/authService'; // Corrected path to src/services
import { useToast } from './ToastContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const loadUserFromToken = useCallback(async () => {
    const token = authService.getAuthToken();
    if (token) {
      try {
        const user = await authService.fetchCurrentUserData(token);
        setCurrentUser(user);
      } catch (error: any) {
        console.warn("Failed to fetch user with stored token:", error.message);
        authService.removeAuthToken(); 
        setCurrentUser(null);
      }
    }
    setIsLoading(false);
  }, [addToast]); // Added addToast for consistency, though not directly used in this specific callback in the provided snippet.

  useEffect(() => {
    setIsLoading(true);
    loadUserFromToken();
  }, [loadUserFromToken]);

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

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    const token = authService.getAuthToken();
    try {
      if (token) {
        await authService.logoutUser(token); 
      }
    } catch (error: any) {
      console.warn("Logout API call failed:", error.message);
    } finally {
      setCurrentUser(null);
      authService.removeAuthToken();
      addToast('info', 'Logged Out', 'You have been successfully logged out.');
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
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, register }}>
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
