import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'bishal_travels_auth_user';

// Authorized Master Credentials
export const MASTER_EMAIL = 'biswajitpramanikrock@gmail.com';
export const MASTER_PASSWORD = 'Biswajit@1989';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const login = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const targetEmail = MASTER_EMAIL.toLowerCase();

    if (trimmedEmail === targetEmail && pass === MASTER_PASSWORD) {
      const authUser: AuthUser = {
        name: 'Biswajit Pramanik',
        email: MASTER_EMAIL,
        role: 'Administrator / Owner',
      };
      setUser(authUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Invalid email address or password. Please verify your credentials.' 
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
