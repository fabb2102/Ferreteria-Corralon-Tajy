import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = 'http://localhost:4000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.usuario);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        return { success: true, user: data.usuario };
      } else {
        return { success: false, error: data.error || 'Error de autenticación' };
      }
    } catch (error) {
      console.error('Login error:', error);

      // Fallback demo mode for development when backend is not available
      if (email === 'admin@ferreteria.com' && password === 'admin123') {
        const demoUser = {
          id: 1,
          nombre: 'Demo Admin',
          email: 'admin@ferreteria.com',
          rol: {
            id: 1,
            nombre: 'Administrador'
          }
        };
        const demoToken = 'demo-token-123';

        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }

      // Demo vendedor
      if (email === 'vendedor@ferreteria.com' && password === 'vendedor123') {
        const demoVendedor = {
          id: 2,
          nombre: 'Demo Vendedor',
          email: 'vendedor@ferreteria.com',
          rol: {
            id: 2,
            nombre: 'Vendedor'
          }
        };
        const demoToken = 'demo-vendedor-token-456';

        setToken(demoToken);
        setUser(demoVendedor);
        localStorage.setItem('token', demoToken);
        localStorage.setItem('user', JSON.stringify(demoVendedor));
        return { success: true, user: demoVendedor };
      }

      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const hasRole = (allowedRoles) => {
    if (!user || !user.rol || !user.rol.nombre) return false;
    const userRole = user.rol.nombre.toLowerCase();

    if (typeof allowedRoles === 'string') {
      return userRole === allowedRoles.toLowerCase();
    }
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.some(role => userRole === role.toLowerCase());
    }
    return false;
  };

  // Funciones de verificación de roles
  const isAdmin = () => hasRole('Administrador');
  const isVendedor = () => hasRole('Vendedor');
  const isAdminOrVendedor = () => hasRole(['Administrador', 'Vendedor']);

  // Permisos específicos para módulos
  const canAccessVentas = () => isAdminOrVendedor();
  const canAccessCompras = () => isAdmin();
  const canAccessProveedores = () => isAdmin();
  const canAccessUsuarios = () => isAdmin();
  const canAccessConfiguracion = () => isAdmin();

  // Permisos para productos
  const canViewProducts = () => isAdminOrVendedor();
  const canEditProducts = () => isAdmin();
  const canDeleteProducts = () => isAdmin();

  // Permisos para clientes
  const canViewClientes = () => isAdminOrVendedor();
  const canEditClientes = () => isAdminOrVendedor();
  const canDeleteClientes = () => isAdmin();

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    hasRole,
    isAdmin,
    isVendedor,
    isAdminOrVendedor,
    canAccessVentas,
    canAccessCompras,
    canAccessProveedores,
    canAccessUsuarios,
    canAccessConfiguracion,
    canViewProducts,
    canEditProducts,
    canDeleteProducts,
    canViewClientes,
    canEditClientes,
    canDeleteClientes,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};