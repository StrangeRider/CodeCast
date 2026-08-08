import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state from token
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Decode token or fetch user status
          // In a simple system we store the user details in localStorage along with the token
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            // Fallback: clear token if user details aren't saved
            logout();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Register user
  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  };

  // Login user
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  // Login as guest
  const loginAsGuest = (username) => {
    const guestUser = { username, isGuest: true };
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guestUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
