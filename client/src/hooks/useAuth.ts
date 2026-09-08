import { useState, useEffect, useCallback } from 'react';
import type { User } from '@shared/schema';

export interface AuthState {
  user: User | null;
  firebaseUser: any | null; // Kept for backwards-compatibility
  loading: boolean;
  error: string | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  username?: string;
  password: string;
  role?: string;
  phone?: string;
  location?: string;
  company?: string;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  identifier?: string;
  password: string;
}

const createFirebaseUserShim = (user: User | null) => {
  if (!user) return null;
  return {
    uid: user.id,
    email: user.email,
    displayName: user.name,
    photoURL: user.profileImage,
    getIdToken: async () => localStorage.getItem('auth_token') || '',
  };
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: true,
    error: null,
  });

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ user: null, firebaseUser: null, loading: false, error: null });
      return null;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user: User = await response.json();
        localStorage.setItem('user_id', user.id);
        localStorage.setItem('firebase-uid', user.id);
        setState({ user, firebaseUser: createFirebaseUserShim(user), loading: false, error: null });
        return user;
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('firebase-uid');
        setState({ user: null, firebaseUser: null, loading: false, error: null });
        return null;
      }
    } catch (err: any) {
      console.error('Failed to fetch authenticated user:', err);
      setState({ user: null, firebaseUser: null, loading: false, error: err.message });
      return null;
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (payload: LoginPayload): Promise<User> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('firebase-uid', data.user.id);

      setState({ user: data.user, firebaseUser: createFirebaseUserShim(data.user), loading: false, error: null });
      return data.user;
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Login failed' }));
      throw error;
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('firebase-uid', data.user.id);

      setState({ user: data.user, firebaseUser: createFirebaseUserShim(data.user), loading: false, error: null });
      return data.user;
    } catch (error: any) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Registration failed' }));
      throw error;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('firebase-uid');
      setState({ user: null, firebaseUser: null, loading: false, error: null });
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    return fetchCurrentUser();
  };

  return {
    ...state,
    login,
    loginWithEmail: async (email: string, pass: string) => login({ email, password: pass }),
    loginWithGoogle: () => {
      throw new Error("Google login is disabled. Please sign in with your email/username.");
    },
    register,
    registerWithEmail: async (email: string, pass: string, name: string) =>
      register({ email, password: pass, name }),
    logout,
    refetchUser: fetchCurrentUser,
    refreshUser,
  } as const;
}