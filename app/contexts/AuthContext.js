// contexts/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Get token from storage on mount
    const storedToken = sessionStorage.getItem('token') || 
                       document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = (newToken) => {
    setToken(newToken);
    sessionStorage.setItem('token', newToken);
    document.cookie = `token=${newToken}; path=/;`;
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);