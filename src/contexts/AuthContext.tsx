
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { tokenService } from '@/lib/api';

interface AuthContextType {
  currentUser: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
  const restoreSession = async () => {
    const token = tokenService.getToken();
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        
        // Verify token is still valid by making a simple API call
        const result = await fetch(`${import.meta.env.VITE_API_URL}/movies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (result.ok) {
          setCurrentUser(user);
        } else {
          // Token invalid, clear everything
          logout();
        }
      } catch (error) {
        // Clear invalid data
        logout();
      }
    }
  };

  restoreSession();
  }, []);

  const login = (token: string, user: User) => {
    tokenService.setToken(token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    tokenService.removeToken();
    localStorage.removeItem('currentUser');
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
