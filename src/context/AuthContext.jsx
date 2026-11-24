import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, getStoredUsers } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lifora_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If not in storage, check service
    if (!user) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user } = await authService.login(email, password);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    setLoading(true);
    try {
      const { user } = await authService.register(registrationData);
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!user) throw new Error('Not authenticated.');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
    // Simulated credential update
    const users = getStoredUsers();
    const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u));
    localStorage.setItem('lifora_users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Quick switcher for demo evaluators to switch roles on the fly
  const switchDemoRole = (targetRole) => {
    const users = getStoredUsers();
    // Check if target is a staff role or main role
    let targetUser = users.find((u) => u.role === targetRole);
    if (!targetUser) {
      targetUser = users.find((u) => u.staffRole === targetRole);
    }
    if (targetUser) {
      const demoToken = `jwt_demo_${targetUser.role || 'user'}_${targetUser.id}`;
      localStorage.setItem('lifora_current_user', JSON.stringify(targetUser));
      localStorage.setItem('lifora_auth_token', demoToken);
      localStorage.setItem('lifora_token', demoToken);
      setUser(targetUser);
      return targetUser;
    }
    return null;
  };

  // Quick staff role switcher within Hospital Portal
  const switchStaffRole = (staffRole) => {
    if (!user || user.role !== 'hospital') return;
    const users = getStoredUsers();
    const matchingStaffUser = users.find((u) => u.role === 'hospital' && u.staffRole === staffRole);
    const demoToken = `jwt_demo_hospital_${staffRole}`;
    if (matchingStaffUser) {
      localStorage.setItem('lifora_current_user', JSON.stringify(matchingStaffUser));
      localStorage.setItem('lifora_auth_token', demoToken);
      localStorage.setItem('lifora_token', demoToken);
      setUser(matchingStaffUser);
      return matchingStaffUser;
    } else {
      const updatedUser = { ...user, staffRole };
      localStorage.setItem('lifora_current_user', JSON.stringify(updatedUser));
      localStorage.setItem('lifora_auth_token', demoToken);
      localStorage.setItem('lifora_token', demoToken);
      setUser(updatedUser);
      return updatedUser;
    }
  };

  const value = {
    user,
    role: user?.role || 'guest',
    staffRole: user?.staffRole || 'hospital_admin',
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    switchDemoRole,
    switchStaffRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
