import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import IngresarProducto from "./IngresarProducto";
import ListarProductos from "./ListarProductos";
import NuevaVenta from "./NuevaVenta";
import HistorialVentas from "./HistorialVentas";
import ListarClientes from "./ListarClientes";
import AgregarCliente from "./AgregarCliente";
import ListarProveedores from "./ListarProveedores";
import GestionCompras from "./GestionCompras";
import GestionUsuarios from "./GestionUsuarios";
import CambiarContrasena from "./CambiarContrasena";
import ConfiguracionSeguridad from "./ConfiguracionSeguridad";
import EditarPerfil from "./EditarPerfil";
import RecuperarContrasena from "./RecuperarContrasena";
import { formatCurrency } from "../utils/currency";
import "../styles/Dashboard.css";

const PanelHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProductos: 0,
    ventasDelMes: 0,
    gananciasDelMes: 0
  });
  const [productosStockBajo, setProductosStockBajo] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = () => {
    // Cargar productos
    const productos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
    const totalProductos = productos.length;

    // Cargar comprobantes
    const comprobantes = JSON.parse(localStorage.getItem('comprobantes') || '[]');
    
    // Obtener mes y año actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();

    // Filtrar comprobantes del mes actual
    const comprobantesDelMes = comprobantes.filter(comprobante => {
      const fechaComprobante = new Date(comprobante.fecha);
      return fechaComprobante.getMonth() === mesActual && 
             fechaComprobante.getFullYear() === anioActual;
    });

    // Calcular total de ventas del mes
    const ventasDelMes = comprobantesDelMes.reduce((total, comprobante) => {
      return total + (comprobante.monto || 0);
    }, 0);

    // Calcular ganancias del mes (ventas - costo de productos vendidos)
    // El costo usado es el costo guardado en cada producto, NO el costo de compras del mes
    const gananciasDelMes = comprobantesDelMes.reduce((totalGanancias, comprobante) => {
      if (!comprobante.productos || !Array.isArray(comprobante.productos)) {
        return totalGanancias;
      }

      const gananciaComprobante = comprobante.productos.reduce((ganancia, productoVendido) => {
        const cantidad = productoVendido.cantidad || 0;
        const precioVenta = productoVendido.precio || 0;

        // Buscar el producto en el inventario para obtener su costo actual
        const productoInventario = productos.find(p =>
          p.id === productoVendido.productoId ||
          p.codigo === productoVendido.codigo ||
          p.nombre === productoVendido.nombre
        );

        // Usar el costo guardado en el producto del inventario
        const costoProducto = productoInventario ? (productoInventario.costo || 0) : 0;

        // Ganancia = (precio de venta - costo) × cantidad
        const gananciaProducto = (precioVenta - costoProducto) * cantidad;

        return ganancia + gananciaProducto;
      }, 0);

      return totalGanancias + gananciaComprobante;
    }, 0);

    setStats({
      totalProductos,
      ventasDelMes,
      gananciasDelMes
    });

    // Filtrar productos con stock bajo (< 5)
    const stockBajo = productos.filter(p => p.stock < 5 && p.activo !== false);
    setProductosStockBajo(stockBajo);
  };

  return (
    <div className="panel-home">
      <div className="panel-home__header">
        <div className="panel-home__header-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Llave inglesa diagonal */}
            <path d="M7 7l10 10"/>
            <path d="M6 8l3-3"/>
            <path d="M15 15l3 3"/>
            <path d="M5 9l2-2"/>
            {/* Destornillador diagonal cruzado */}
            <path d="M17 7L7 17"/>
            <circle cx="17" cy="7" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="17" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        <h1>Ferretería Corralón Tajy</h1>
        <p>Gestiona tu ferretería de manera eficiente y profesional</p>
      </div>
      
      <div className="panel-stats">
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>Productos</h3>
            <p className="stat-card__value">{stats.totalProductos}</p>
            <p className="stat-card__label">En inventario</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>Ventas del Mes</h3>
            <p className="stat-card__value">{formatCurrency(stats.ventasDelMes)}</p>
            <p className="stat-card__label">Ingresos totales</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>Ganancias</h3>
            <p className="stat-card__value">{formatCurrency(stats.gananciasDelMes)}</p>
            <p className="stat-card__label">Ganancias del mes</p>
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {productosStockBajo.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#FFF5F5',
          border: '2px solid #FC8181',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h2 style={{ margin: 0, color: '#C53030', fontSize: '20px', fontWeight: '700' }}>
              Alertas de Stock Crítico ({productosStockBajo.length})
            </h2>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #FEB2B2'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #C53030 0%, #9B2C2C 100%)',
                  color: 'white'
                }}>
                  <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Código</th>
                  <th style={{ padding: '18px 15px', textAlign: 'left', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                  <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Actual</th>
                  <th style={{ padding: '18px 15px', textAlign: 'center', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosStockBajo.map((producto, index) => (
                  <tr key={producto.id} style={{
                    borderBottom: index < productosStockBajo.length - 1 ? '1px solid #FED7D7' : 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 15px', fontWeight: '600', color: '#2D3748' }}>
                      {producto.codigo}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#4A5568' }}>
                      {producto.nombre}
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: producto.stock === 0 ? '#FEE2E2' : '#FEF3C7',
                        color: producto.stock === 0 ? '#C53030' : '#D97706',
                        fontWeight: '700',
                        fontSize: '14px',
                        border: `2px solid ${producto.stock === 0 ? '#FC8181' : '#FCD34D'}`
                      }}>
                        {producto.stock} {producto.stock === 0 ? '(Agotado)' : 'unidades'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <button
                        onClick={() => navigate('/panel/compras')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#2563EB';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#3B82F6';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        Realizar Compra
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

  </div>
  );
};

function Panel() {
  return (
    <Layout>
      <Routes>
        {/* Productos - Ingresar solo para Admin */}
        <Route
          path="/productos/ingresar"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canEditProducts()}>
              <IngresarProducto />
            </ProtectedRoute>
          }
        />
        {/* Productos - Listar para Admin y Vendedor */}
        <Route
          path="/productos/listar"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canViewProducts()}>
              <ListarProductos />
            </ProtectedRoute>
          }
        />

        {/* Clientes - Para Admin y Vendedor */}
        <Route
          path="/clientes/listar"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canViewClientes()}>
              <ListarClientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes/nuevo"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canEditClientes()}>
              <AgregarCliente />
            </ProtectedRoute>
          }
        />

        {/* Proveedores - Solo Admin */}
        <Route
          path="/proveedores/listar"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canAccessProveedores()}>
              <ListarProveedores />
            </ProtectedRoute>
          }
        />

        {/* Usuarios - Solo Admin */}
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canAccessUsuarios()}>
              <GestionUsuarios />
            </ProtectedRoute>
          }
        />

        {/* Ventas - Para Admin y Vendedor */}
        <Route
          path="/ventas/nueva"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canAccessVentas()}>
              <NuevaVenta />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ventas/historial"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canAccessVentas()}>
              <HistorialVentas />
            </ProtectedRoute>
          }
        />

        {/* Compras - Solo Admin */}
        <Route
          path="/compras"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.canAccessCompras()}>
              <GestionCompras />
            </ProtectedRoute>
          }
        />

        {/* Administración - Solo Admin */}
        <Route
          path="/admin/cambiar-contrasena"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.isAdmin()}>
              <CambiarContrasena />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/configuracion-seguridad"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.isAdmin()}>
              <ConfiguracionSeguridad />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editar-perfil"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.isAdmin()}>
              <EditarPerfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recuperar-contrasena"
          element={
            <ProtectedRoute requirePermission={(auth) => auth.isAdmin()}>
              <RecuperarContrasena />
            </ProtectedRoute>
          }
        />

        {/* Panel Home - Todos los usuarios autenticados */}
        <Route path="/" element={<PanelHome />} />
      </Routes>
    </Layout>
  );
}

export default Panel;