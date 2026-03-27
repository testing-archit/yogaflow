import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
  joinDate?: string;
  classesAttended?: number;
  hoursPracticed?: number;
  streak?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminChecking: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (googleUser: { name: string; email: string; picture?: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(false);

  useEffect(() => {
  // Check localStorage for existing user state (mock auth)
  const savedUser = localStorage.getItem('yogaFlowUser');
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      const users = JSON.parse(localStorage.getItem('yogaFlowUsers') || '[]');
      const foundUser = users.find((u: any) => u.email === parsedUser.email);

      // Basic check for admin role mock
      const roleAdmin = foundUser?.role === 'admin' || foundUser?.isAdmin === true ||
        (Array.isArray(foundUser?.roles) && foundUser.roles.includes('admin'));

      setIsAdmin(roleAdmin);
    } catch (e) {
      console.error('Error loading user data:', e);
      setUser(null);
      setIsAdmin(false);
    }
    return;
  }

  // No local user – try server session
  fetch('/api/auth/me')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data) {
        setUser(data);
        localStorage.setItem('yogaFlowUser', JSON.stringify(data));
        // Admin role check – simple heuristic
        const roleAdmin = data.role === 'ADMIN' || data.role === 'admin';
        setIsAdmin(!!roleAdmin);
      }
    })
    .catch(() => {
      setUser(null);
      setIsAdmin(false);
    });
}, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // During migration away from mock auth, we treat "login" as establishing a server session
    // and ensuring the user exists in Neon.
    try {
      const r = await fetch('/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      setUser(data);
      localStorage.setItem('yogaFlowUser', JSON.stringify(data));
      const roleAdmin = data.role === 'ADMIN' || data.role === 'admin';
      setIsAdmin(!!roleAdmin);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const r = await fetch('/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      setUser(data);
      localStorage.setItem('yogaFlowUser', JSON.stringify(data));
      const roleAdmin = data.role === 'ADMIN' || data.role === 'admin';
      setIsAdmin(!!roleAdmin);
      return true;
    } catch {
      return false;
    }
  };

  const loginWithGoogle = async (googleUser: { name: string; email: string; picture?: string }): Promise<boolean> => {
    // After Google OAuth completes, we can ensure the user exists in Neon by calling the same endpoint.
    try {
      const r = await fetch('/api/auth/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: googleUser.name, email: googleUser.email }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      setUser(data);
      localStorage.setItem('yogaFlowUser', JSON.stringify(data));
      const roleAdmin = data.role === 'ADMIN' || data.role === 'admin';
      setIsAdmin(!!roleAdmin);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('yogaFlowUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin,
      isAdminChecking,
      login,
      signup,
      loginWithGoogle,
      logout,
    }}>
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
