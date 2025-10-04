import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null); // ADD THIS
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken'); // ADD THIS
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken); // ADD THIS
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid by calling /api/auth/me
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          
          // Update stored user data if it differs
          if (storedUser !== JSON.stringify(currentUser)) {
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        } catch (error) {
          // Token is invalid, clear everything
          console.log('Token validation failed:', error);
          logout();
        }
      } else if (storedUser) {
        // Clean up orphaned user data
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // UPDATED: Now accepts refresh token as third parameter
  const login = (userData, userToken, userRefreshToken) => {
    setUser(userData);
    setToken(userToken);
    setRefreshToken(userRefreshToken); // ADD THIS
    
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Store refresh token if provided
    if (userRefreshToken) {
      localStorage.setItem('refreshToken', userRefreshToken); // ADD THIS
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  };

  const logout = async () => {
    // Call backend logout endpoint if authenticated
    if (token) {
      try {
        // Include refresh token in logout request if available
        const logoutData = refreshToken ? { refreshToken } : {}; // ADD THIS
        await axios.post('/api/auth/logout', logoutData); // UPDATED
      } catch (error) {
        console.log('Logout request failed:', error);
        // Continue with local logout even if backend call fails
      }
    }

    setUser(null);
    setToken(null);
    setRefreshToken(null); // ADD THIS
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // ADD THIS
    localStorage.removeItem('user');
    
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  // ADD THIS: Method to update tokens (useful for refresh)
  const updateTokens = (newToken, newRefreshToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
      localStorage.setItem('refreshToken', newRefreshToken);
    }
  };

  // ADD THIS: Helper method to get auth header
  const getAuthHeader = () => {
    return token ? `Bearer ${token}` : null;
  };

  const value = {
    user,
    token,
    refreshToken, // ADD THIS
    loading,
    login,
    logout,
    isAuthenticated,
    updateUser,
    updateTokens, // ADD THIS
    getAuthHeader, // ADD THIS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};