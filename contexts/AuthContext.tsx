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
    } else {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check localStorage for existing users
    const users = JSON.parse(localStorage.getItem('yogaFlowUsers') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        plan: foundUser.plan,
        joinDate: foundUser.joinDate,
        classesAttended: foundUser.classesAttended || 0,
        hoursPracticed: foundUser.hoursPracticed || 0,
        streak: foundUser.streak || 0,
      };
      setUser(userData);
      localStorage.setItem('yogaFlowUser', JSON.stringify(userData));
      
      const roleAdmin = foundUser?.role === 'admin' || foundUser?.isAdmin === true;
      setIsAdmin(roleAdmin);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('yogaFlowUsers') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      return false; // User exists
    }

    const userId = Date.now().toString();
    const joinDate = new Date().toISOString();
    
    const newUser = {
      id: userId,
      name,
      email,
      password, // In production, this should be hashed
      joinDate,
      classesAttended: 0,
      hoursPracticed: 0,
      streak: 0,
    };

    users.push(newUser);
    localStorage.setItem('yogaFlowUsers', JSON.stringify(users));

    const userData = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      joinDate: newUser.joinDate,
      classesAttended: 0,
      hoursPracticed: 0,
      streak: 0,
    };
    setUser(userData);
    localStorage.setItem('yogaFlowUser', JSON.stringify(userData));
    setIsAdmin(false);
    
    return true;
  };

  const loginWithGoogle = async (googleUser: { name: string; email: string; picture?: string }): Promise<boolean> => {
    // Mock successful google login
    const users = JSON.parse(localStorage.getItem('yogaFlowUsers') || '[]');
    let foundUser = users.find((u: any) => u.email === googleUser.email);
    
    if (!foundUser) {
      const userId = Date.now().toString();
      foundUser = {
        id: userId,
        name: googleUser.name,
        email: googleUser.email,
        joinDate: new Date().toISOString(),
        authProvider: 'google',
        photoURL: googleUser.picture,
        classesAttended: 0,
        hoursPracticed: 0,
        streak: 0,
      };
      users.push(foundUser);
      localStorage.setItem('yogaFlowUsers', JSON.stringify(users));
    }
    
    const userData = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      joinDate: foundUser.joinDate,
      plan: foundUser.plan,
      classesAttended: foundUser.classesAttended || 0,
      hoursPracticed: foundUser.hoursPracticed || 0,
      streak: foundUser.streak || 0,
    };
    
    setUser(userData);
    localStorage.setItem('yogaFlowUser', JSON.stringify(userData));
    const roleAdmin = foundUser?.role === 'admin' || foundUser?.isAdmin === true;
    setIsAdmin(roleAdmin);
    return true;
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
