import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Ferretería Corralón Tajy</h2>
        </div>
        
        <div className="sidebar-content">
          <button 
            className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Menú hamburguesa expandido */}
      <div className={`hamburger-overlay ${isMenuOpen ? 'active' : ''}`} onClick={closeMenu}>
        <div className={`hamburger-menu-content ${isMenuOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="menu-header">
            <h3>Menú de Navegación</h3>
            <button className="close-btn" onClick={closeMenu}>×</button>
          </div>
          
          <div className="menu-sections">
            <div className="menu-section">
              <h4>
                <span className="menu-icon">📦</span>
                Productos
              </h4>
              <ul>
                <li>
                  <Link 
                    to="/panel/productos/ingresar" 
                    className={isActive('/productos/ingresar') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    <span className="item-icon">➕</span>
                    Agregar Producto
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/panel/productos/listar" 
                    className={isActive('/productos/listar') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    <span className="item-icon">📋</span>
                    Listar Productos
                  </Link>
                </li>
              </ul>
            </div>

            <div className="menu-section">
              <h4>
                <span className="menu-icon">👥</span>
                Clientes
              </h4>
              <ul>
                <li>
                  <Link 
                    to="/panel/clientes/listar" 
                    className={isActive('/clientes/listar') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    <span className="item-icon">👤</span>
                    Lista de Clientes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="menu-section">
              <h4>
                <span className="menu-icon">📄</span>
                Comprobantes
              </h4>
              <ul>
                <li>
                  <Link 
                    to="/panel/comprobantes/nuevo" 
                    className={isActive('/comprobantes/nuevo') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    <span className="item-icon">🆕</span>
                    Nuevo Comprobante
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/panel/comprobantes/historial" 
                    className={isActive('/comprobantes/historial') ? 'active' : ''}
                    onClick={closeMenu}
                  >
                    <span className="item-icon">📊</span>
                    Historial
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;

