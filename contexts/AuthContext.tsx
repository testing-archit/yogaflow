import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/react';

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
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(false);

  useEffect(() => {
    if (!isUserLoaded) return;

    if (isSignedIn && clerkUser) {
      const mappedUser: User = {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.username || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        joinDate: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString(),
      };
      setUser(mappedUser);

      // Fetch additional data from Neon (e.g., admin status, subscription)
      setIsAdminChecking(true);
      getToken().then((token) => {
        return fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setUser((prev) => (prev ? { ...prev, ...data } : null));
            setIsAdmin(data.role === 'ADMIN' || data.role === 'admin');
          }
        })
        .finally(() => setIsAdminChecking(false));
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, [isUserLoaded, isSignedIn, clerkUser]);

  const login = async (): Promise<boolean> => {
    openSignIn({ forceRedirectUrl: '/', fallbackRedirectUrl: '/' });
    return true;
  };

  const signup = async (): Promise<boolean> => {
    openSignUp({ forceRedirectUrl: '/', fallbackRedirectUrl: '/' });
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    // Clerk handles Google login via its own components/hooks
    openSignIn({ forceRedirectUrl: '/', fallbackRedirectUrl: '/' });
    return true;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('yogaFlowUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!isSignedIn,
      isAdmin,
      isAdminChecking,
      login,
      signup,
      loginWithGoogle,
      logout,
      getToken,
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
