import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stocksense_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await apiRequest('/auth/me', 'GET', null, token);
          setUser(userData);
        } catch (err) {
          console.warn('Session expired, logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', 'POST', { email, password });
    localStorage.setItem('stocksense_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, role) => {
    const data = await apiRequest('/auth/register', 'POST', { name, email, password, role });
    localStorage.setItem('stocksense_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const requestOTP = async (email) => {
    return await apiRequest('/auth/request-otp', 'POST', { email });
  };

  const resetPassword = async (email, otp, newPassword) => {
    return await apiRequest('/auth/reset-password', 'POST', { email, otp, newPassword });
  };

  const logout = () => {
    localStorage.removeItem('stocksense_token');
    setToken(null);
    setUser(null);
  };

  const switchRolePreview = (newRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        requestOTP,
        resetPassword,
        logout,
        switchRolePreview
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
