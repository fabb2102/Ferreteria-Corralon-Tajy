import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import './Sidebar.css';

/**
 * Modern Sidebar component with improved navigation
 */
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    logout,
    canViewProducts,
    canViewClientes,
    canAccessVentas,
    canAccessCompras,
    canAccessProveedores,
    canAccessUsuarios
  } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };


  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <h2 className="sidebar__brand-title">Ferretería</h2>
          <p className="sidebar__brand-subtitle">Sistema Admin</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar__nav">
        <ul className="nav-list">
          <li>
            <Link
              to="/panel"
              className={`nav-item ${isActive('/panel') && location.pathname === '/panel' ? 'nav-item--active' : ''}`}
            >
              <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              </svg>
              <span className="nav-text">Panel Principal</span>
            </Link>
          </li>

          {/* Productos - Visible para Admin y Vendedor */}
          {canViewProducts() && (
            <li>
              <Link
                to="/panel/productos/listar"
                className={`nav-item ${isActive('/productos/listar') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                <span className="nav-text">Productos</span>
              </Link>
            </li>
          )}

          {/* Clientes - Visible para Admin y Vendedor */}
          {canViewClientes() && (
            <li>
              <Link
                to="/panel/clientes/listar"
                className={`nav-item ${isActive('/clientes/listar') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="nav-text">Clientes</span>
              </Link>
            </li>
          )}

          {/* Proveedores - Visible solo para Admin */}
          {canAccessProveedores() && (
            <li>
              <Link
                to="/panel/proveedores/listar"
                className={`nav-item ${isActive('/proveedores/listar') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span className="nav-text">Proveedores</span>
              </Link>
            </li>
          )}

          {/* Compras - Visible solo para Admin */}
          {canAccessCompras() && (
            <li>
              <Link
                to="/panel/compras"
                className={`nav-item ${isActive('/panel/compras') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span className="nav-text">Compras</span>
              </Link>
            </li>
          )}

          {/* Ventas - Visible para Admin y Vendedor */}
          {canAccessVentas() && (
            <li>
              <Link
                to="/panel/ventas/historial"
                className={`nav-item ${isActive('/ventas/historial') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span className="nav-text">Ventas</span>
              </Link>
            </li>
          )}

          {/* Usuarios - Visible solo para Admin */}
          {canAccessUsuarios() && (
            <li>
              <Link
                to="/panel/usuarios"
                className={`nav-item ${isActive('/panel/usuarios') ? 'nav-item--active' : ''}`}
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <polyline points="17,11 19,13 23,9"/>
                </svg>
                <span className="nav-text">Usuarios</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        {/* User info */}
        {user && (
          <div className="user-info">
            <div className="user-info__name">{user.nombre}</div>
            <div className="user-info__role">{user.rol?.nombre}</div>
          </div>
        )}
        
        {/* Logout Button */}
        <button onClick={handleLogout} className="logout-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;