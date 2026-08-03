import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { clearHomeCache } from '../lib/homeCache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ccs_token') || sessionStorage.getItem('ccs_token');
    const storedUser = localStorage.getItem('ccs_user') || sessionStorage.getItem('ccs_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function login(token, userData, remember = true) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem('ccs_token', token);
    store.setItem('ccs_user', JSON.stringify(userData));
    clearHomeCache();
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('ccs_token');
    localStorage.removeItem('ccs_user');
    sessionStorage.removeItem('ccs_token');
    sessionStorage.removeItem('ccs_user');
    clearHomeCache();
    setUser(null);
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    login(data.token, data.user);
    return data;
  }

  async function applySeller(payload) {
    const { data } = await api.post('/auth/apply-seller', payload);
    return data;
  }

  async function signIn(identifier, password, remember = true) {
    const { data } = await api.post('/auth/login', { identifier, password });
    login(data.token, data.user, remember);
    return data;
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/auth/me', payload);
    const updatedUser = { ...user, ...payload };
    delete updatedUser.password;
    const store = localStorage.getItem('ccs_token') ? localStorage : sessionStorage;
    store.setItem('ccs_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, signIn, applySeller, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
