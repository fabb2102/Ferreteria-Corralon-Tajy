import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
import './Header.css';

/**
 * Header component with breadcrumb navigation
 */
const Header = () => {
  const location = useLocation();

  const getBreadcrumbData = (pathname) => {
    const breadcrumbMap = {
      [ROUTES.PANEL]: { title: 'Panel', subtitle: 'Panel de control principal' },
      [ROUTES.PRODUCTS.LIST]: { title: 'Productos', subtitle: 'Gestión de inventario' },
      [ROUTES.PRODUCTS.CREATE]: { title: 'Nuevo Producto', subtitle: 'Agregar producto al inventario' },
      [ROUTES.CLIENTS.LIST]: { title: 'Clientes', subtitle: 'Gestión de clientes' },
      [ROUTES.CLIENTS.CREATE]: { title: 'Nuevo Cliente', subtitle: 'Agregar cliente al sistema' },
      [ROUTES.INVOICES.CREATE]: { title: 'Nueva Factura', subtitle: 'Crear factura de venta' },
      [ROUTES.INVOICES.LIST]: { title: 'Facturas', subtitle: 'Historial de ventas' },
      [ROUTES.RECEIPTS.CREATE]: { title: 'Nuevo Comprobante', subtitle: 'Generar comprobante' },
      [ROUTES.RECEIPTS.LIST]: { title: 'Comprobantes', subtitle: 'Historial de comprobantes' },
    };

    return breadcrumbMap[pathname] || { title: 'Ferretería', subtitle: 'Gestión profesional' };
  };

  const breadcrumbData = getBreadcrumbData(location.pathname);

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__breadcrumb">
          <h1 className="header__title">{breadcrumbData.title}</h1>
          <p className="header__subtitle">{breadcrumbData.subtitle}</p>
        </div>
        
      </div>
    </header>
  );
};

export default Header;