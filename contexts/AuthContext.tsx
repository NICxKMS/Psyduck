import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiService } from '../services/apiService';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  membership: 'free' | 'premium' | 'pro';
  xp: number;
  level: number;
  avatar?: string;
  avatarUrl?: string;
  joinedAt: Date;
  streak: number;
  currentStreak?: number;
  longestStreak?: number;
  badges: string[];
  // Optional profile fields for UI compatibility
  firstName?: string;
  lastName?: string;
  bio?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  preferredLanguages?: string[];
  timezone?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  jobTitle?: string;
  company?: string;
  yearsOfExperience?: number;
  interests?: string[];
  goals?: string[];
  totalXp?: number;
  projects?: {
    completed: number;
    inProgress: number;
    total: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  upgradeToPremium: () => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo user data with premium membership
const DEMO_USER: User = {
  id: 'demo-user-123',
  username: 'demo',
  email: 'demo@psyduck.dev',
  displayName: 'Demo User',
  membership: 'premium', // Changed from 'free' to 'premium'
  xp: 2340,
  totalXp: 2340,
  level: 7,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
  joinedAt: new Date('2024-01-15'),
  streak: 12,
  currentStreak: 12,
  longestStreak: 15,
  badges: ['first-project', 'week-streak', 'code-reviewer', 'premium-member'],
  firstName: 'Demo',
  lastName: 'User',
  bio: 'Learning by building cool projects with Psyduck.',
  skillLevel: 'Intermediate',
  preferredLanguages: ['JavaScript', 'TypeScript'],
  timezone: 'UTC',
  location: 'Internet',
  website: 'https://psyduck.dev',
  githubUrl: 'https://github.com/psyduck-platform',
  linkedinUrl: 'https://www.linkedin.com/company/psyduck',
  portfolioUrl: 'https://psyduck.dev',
  jobTitle: 'Developer',
  company: 'Psyduck',
  yearsOfExperience: 3,
  interests: ['Web', 'AI'],
  projects: {
    completed: 8,
    inProgress: 2,
    total: 10
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize auth state and API service
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('psyduck_user');
        const savedToken = localStorage.getItem('psyduck_token');
        
        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Initialize API service with saved auth
          apiService.setAuth(savedToken, parsedUser);
        } else {
          // Clear API service auth
          apiService.setAuth(null, null);
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        localStorage.removeItem('psyduck_user');
        localStorage.removeItem('psyduck_token');
        apiService.setAuth(null, null);
      }
      setIsLoading(false);
    };

    // Simulate initial auth check
    setTimeout(initAuth, 500);
  }, []);

  // Update API service when user changes
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('psyduck_token') || `mock-token-${user.id}`;
      apiService.setAuth(token, user);
    } else {
      apiService.setAuth(null, null);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        setUser(userData);
        localStorage.setItem('psyduck_user', JSON.stringify(userData));
        localStorage.setItem('psyduck_token', token);
        
        // API service auth is set automatically via the useEffect above
        
        if (userData.membership === 'premium' || userData.membership === 'pro') {
          toast.success('Welcome back! You have premium access.');
        } else {
          toast.success('Login successful!');
        }
        setAuthError(null);
        
        return true;
      } else {
        const message = response.message || 'Login failed';
        setAuthError(message);
        toast.error(message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Login failed. Please try again.');
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(email, password, username);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        setUser(userData);
        localStorage.setItem('psyduck_user', JSON.stringify(userData));
        localStorage.setItem('psyduck_token', token);
        
        toast.success('Registration successful! Welcome to Psyduck!');
        setAuthError(null);
        return true;
      } else {
        const message = response.message || 'Registration failed';
        setAuthError(message);
        toast.error(message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('psyduck_user');
    localStorage.removeItem('psyduck_token');
    
    // Clear API service auth
    apiService.setAuth(null, null);
    setAuthError(null);
    
    // Call API logout (fire and forget)
    apiService.logout().catch(error => {
      console.warn('Logout API call failed:', error);
    });
    
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('psyduck_user', JSON.stringify(updatedUser));
    
    // Update API service with new user data
    const token = localStorage.getItem('psyduck_token');
    if (token) {
      apiService.setAuth(token, updatedUser);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      updateUser(updates);
      toast.success('Profile updated');
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const upgradeToPremium = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedUser = {
        ...user,
        membership: 'premium' as const,
        badges: [...user.badges.filter(b => b !== 'premium-member'), 'premium-member']
      };
      
      setUser(updatedUser);
      localStorage.setItem('psyduck_user', JSON.stringify(updatedUser));
      
      // Update API service
      const token = localStorage.getItem('psyduck_token');
      if (token) {
        apiService.setAuth(token, updatedUser);
      }
      
      toast.success('🎉 Welcome to Premium! You now have access to all features.');
      return true;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Upgrade failed. Please try again.');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    updateProfile,
    upgradeToPremium,
    error: authError,
    clearError: () => setAuthError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;