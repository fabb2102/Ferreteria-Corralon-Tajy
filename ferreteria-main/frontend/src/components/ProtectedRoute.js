import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de protección de rutas basado en permisos
 * Redirige a página de acceso denegado si el usuario no tiene permisos
 */
const ProtectedRoute = ({ children, requirePermission }) => {
  const auth = useAuth();
  const { user, loading } = auth;

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Cargando...
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Verificar permisos si se especifica una función de validación
  if (requirePermission && typeof requirePermission === 'function') {
    const hasPermission = requirePermission(auth);

    if (!hasPermission) {
      return <AccessDenied />;
    }
  }

  // Usuario autenticado y con permisos
  return children;
};

/**
 * Componente de Acceso Denegado (403 Forbidden)
 */
const AccessDenied = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f7f8fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px 60px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: '#EF4444',
          marginBottom: '20px'
        }}>
          403
        </div>

        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#1a1d29',
          marginBottom: '16px'
        }}>
          Acceso Denegado
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#6c757d',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          No tienes permisos para acceder a este módulo. <br />
          Por favor, contacta al administrador si necesitas acceso.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            Volver Atrás
          </button>

          <button
            onClick={() => window.location.href = '/panel'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1976d2'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2196f3'}
          >
            Ir al Panel Principal
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '24px',
        fontSize: '14px',
        color: '#9ca3af'
      }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Módulo protegido por permisos de usuario
      </div>
    </div>
  );
};

export default ProtectedRoute;
