import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const parseResponsePayload = async (response, defaultMsg) => {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return { message: text || `${defaultMsg} (HTTP ${response.status})` };
  } catch {
    return { message: `${defaultMsg} (HTTP ${response.status})` };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await parseResponsePayload(response, 'Login failed');
      throw new Error(errorData.message || `Login failed (${response.status})`);
    }
    
    const data = await parseResponsePayload(response, 'Unexpected response format');
    setUser(data);
    return data;
  };

  const signup = async (name, email, password, income, expenses) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        email, 
        password, 
        income: Number(income || 0), 
        expenses: Number(expenses || 0) 
      }),
    });
    
    if (!response.ok) {
      const errorData = await parseResponsePayload(response, 'Signup failed');
      throw new Error(errorData.message || `Signup failed (${response.status})`);
    }
    
    const data = await parseResponsePayload(response, 'Unexpected response format');
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser: fetchProfile }}>
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
