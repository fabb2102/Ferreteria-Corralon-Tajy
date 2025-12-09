import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Articulos.css";
import { formatCurrency } from "../utils/currency";
import jsPDF from 'jspdf';
import { apiService } from '../services/api';
import { productService } from '../services/productService';

function ListarProductos() {
  const { isAdmin, canEditProducts, canDeleteProducts } = useAuth();
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'active' | 'inactive'
  const [quickFilter, setQuickFilter] = useState('todos'); // 'todos' | 'stock-bajo' | 'stock-critico'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para selección múltiple
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    // Migración: Asegurar que todos los productos en localStorage tengan 'activo' definido y eliminar duplicados
    const migrarProductosLocalStorage = () => {
      try {
        const todosLosProductos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
        if (todosLosProductos.length > 0) {
          // Eliminar duplicados por ID
          const productosUnicos = [];
          const idsVistos = new Set();

          todosLosProductos.forEach(p => {
            if (!idsVistos.has(p.id)) {
              idsVistos.add(p.id);
              productosUnicos.push({
                ...p,
                activo: p.activo !== undefined ? p.activo : true
              });
            }
          });

          if (productosUnicos.length !== todosLosProductos.length) {
            console.log(`🧹 Productos duplicados eliminados: ${todosLosProductos.length} -> ${productosUnicos.length}`);
          }

          localStorage.setItem('todolosproductos', JSON.stringify(productosUnicos));
          console.log('✅ Migración de productos completada');
        }
      } catch (error) {
        console.error('Error en migración de productos:', error);
      }
    };

    migrarProductosLocalStorage();
    fetchProductos();
  }, []);

  useEffect(() => {
    let filtered = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply quick filter
    if (quickFilter === 'stock-critico') {
      filtered = filtered.filter(p => p.stock < 5);
    } else if (quickFilter === 'stock-bajo') {
      filtered = filtered.filter(p => p.stock < 10);
    }

    // Apply viewMode filter
    if (!isAdmin()) {
      // Non-admin users only see active products
      filtered = filtered.filter(p => p.activo === true || p.activo === undefined);
    } else {
      // Admin can choose view mode
      if (viewMode === 'active') {
        filtered = filtered.filter(p => p.activo === true || p.activo === undefined);
      } else if (viewMode === 'inactive') {
        filtered = filtered.filter(p => p.activo === false);
      }
      // 'all' mode shows everything, no additional filtering
    }

    setFilteredProductos(filtered);
    setCurrentPage(1);
  }, [searchTerm, productos, viewMode, quickFilter, isAdmin]);

  // Refresh products when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      fetchProductos();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also refresh when navigating back to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProductos();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchProductos = async () => {
    try {
      console.log('=== CARGANDO PRODUCTOS DESDE BACKEND ===');
      setLoading(true);
      
      const token = localStorage.getItem('token');
      console.log('Token disponible para productos:', !!token);
      
      if (!token) {
        console.log('No hay token, usando productos de fallback');
        const fallbackProductos = [
          { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A', activo: true },
          { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B', activo: true },
          { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C', activo: true }
        ];
        setProductos(fallbackProductos);
        verificarStockBajo(fallbackProductos);
        return;
      }
      
      console.log('Intentando cargar productos desde backend con token...');
      const productosData = await apiService.get('/productos');
      console.log('✅ Productos cargados exitosamente desde backend:', productosData.length, productosData);

      // Asegurar que todos los productos tengan la propiedad 'activo' definida
      const productosConActivo = productosData.map(p => ({
        ...p,
        activo: p.activo !== undefined ? p.activo : true
      }));

      setProductos(productosConActivo);

      // Sincronizar con localStorage
      localStorage.setItem('todolosproductos', JSON.stringify(productosConActivo));
      console.log('✅ Productos sincronizados con localStorage');

      // Verificar stock bajo al cargar productos
      verificarStockBajo(productosConActivo);
      
    } catch (error) {
      console.error('❌ Error al cargar productos desde backend:', error);
      // Fallback to mock data if backend fails
      const fallbackProductos = [
        { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A', activo: true },
        { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B', activo: true },
        { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C', activo: true }
      ];
      console.log('Usando productos de fallback por error:', fallbackProductos);
      setProductos(fallbackProductos);
      verificarStockBajo(fallbackProductos);
    } finally {
      setLoading(false);
    }
  };

  const verificarStockBajo = (listaProductos) => {
    const productosConStockBajo = listaProductos.filter(producto => producto.stock <= 5 && producto.stock > 0);
    const productosAgotados = listaProductos.filter(producto => producto.stock === 0);
    
    if (productosConStockBajo.length > 0 || productosAgotados.length > 0) {
      let mensaje = '';
      
      if (productosAgotados.length > 0) {
        mensaje += `🚨 PRODUCTOS AGOTADOS (${productosAgotados.length}):\n`;
        productosAgotados.slice(0, 5).forEach(producto => {
          mensaje += `• ${producto.codigo} - ${producto.nombre}\n`;
        });
        if (productosAgotados.length > 5) {
          mensaje += `... y ${productosAgotados.length - 5} más\n`;
        }
        mensaje += '\n';
      }
      
      if (productosConStockBajo.length > 0) {
        mensaje += `⚠️ STOCK BAJO (${productosConStockBajo.length} productos ≤5 unidades):\n`;
        productosConStockBajo.slice(0, 5).forEach(producto => {
          mensaje += `• ${producto.codigo} - ${producto.nombre} (Stock: ${producto.stock})\n`;
        });
        if (productosConStockBajo.length > 5) {
          mensaje += `... y ${productosConStockBajo.length - 5} más\n`;
        }
      }
      
      // Solo mostrar aviso una vez por sesión
      const avisoMostrado = sessionStorage.getItem('avisoStockMostrado');
      if (!avisoMostrado) {
        setTimeout(() => {
          if (window.confirm(mensaje + '\n¿Deseas revisar la lista completa de productos?')) {
            // El usuario ya está en la página de productos, solo hacer scroll al top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 1000);
        sessionStorage.setItem('avisoStockMostrado', 'true');
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Función para obtener el badge de stock
  const getStockBadge = (stock) => {
    if (stock < 5) {
      return {
        color: '#EF4444',
        bg: '#FEE2E2',
        text: 'Stock Crítico',
        borderColor: '#FCA5A5'
      };
    }
    if (stock <= 10) {
      return {
        color: '#F59E0B',
        bg: '#FEF3C7',
        text: 'Stock Bajo',
        borderColor: '#FCD34D'
      };
    }
    return {
      color: '#10B981',
      bg: '#D1FAE5',
      text: 'Stock Normal',
      borderColor: '#6EE7B7'
    };
  };

  // Funciones para selección múltiple
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedProductos([]);
  };

  const toggleSelectProducto = (productoId) => {
    setSelectedProductos(prev =>
      prev.includes(productoId)
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId]
    );
  };

  const selectAllProductos = () => {
    const currentPageIds = currentProductos.map(p => p.id);
    const allCurrentSelected = currentPageIds.every(id => selectedProductos.includes(id));

    if (allCurrentSelected) {
      // Deseleccionar todos los de la página actual
      setSelectedProductos(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Seleccionar todos los de la página actual (mantener los de otras páginas)
      setSelectedProductos(prev => {
        const newSelection = [...prev];
        currentPageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} productos
        </div>
        
        <div className="pagination">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Primera página"
          >
            «
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Página anterior"
          >
            ‹
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Página siguiente"
          >
            ›
          </button>
          
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Última página"
          >
            »
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="content">
        <h1>Lista de Productos</h1>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isAdmin() ? 'Gestión de Productos' : 'Lista de Productos'}</h1>
      </div>

      {/* Nota informativa para vendedores */}
      {!isAdmin() && (
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          <span style={{ fontSize: '14px', color: '#1565c0' }}>
            Visualizando productos y stock. Solo los administradores pueden agregar o modificar productos.
          </span>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="search-container" style={{ flex: 1, marginRight: '20px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, código, categoría o proveedor..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          {isAdmin() && currentProductos.length > 0 && (
            <button
              onClick={toggleSelectMode}
              style={{
                padding: '8px 16px',
                backgroundColor: isSelectMode ? '#EF4444' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {isSelectMode ? 'Cancelar' : 'Seleccionar'}
            </button>
          )}
        </div>

        {/* Controles de selección múltiple - Solo visible cuando está activo */}
        {isAdmin() && isSelectMode && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#F3F4F6',
            borderRadius: '6px',
            border: '1px solid #D1D5DB'
          }}>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {selectedProductos.length} seleccionado{selectedProductos.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={selectAllProductos}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {currentProductos.every(p => selectedProductos.includes(p.id)) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>

            {/* Botón Activar - solo si hay productos inactivos seleccionados */}
            {selectedProductos.length > 0 && (() => {
              const productosSeleccionados = productos.filter(p => selectedProductos.includes(p.id));
              const tieneInactivos = productosSeleccionados.some(p => p.activo === false);
              const tieneActivos = productosSeleccionados.some(p => p.activo !== false);
              const todosInactivos = productosSeleccionados.every(p => p.activo === false);

              return (
                <>
                  {tieneInactivos && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Activar ${productosSeleccionados.filter(p => p.activo === false).length} producto(s)?`)) {
                          try {
                            for (const producto of productosSeleccionados) {
                              if (producto.activo === false) {
                                await productService.toggleStatus(producto.id);
                              }
                            }
                            await fetchProductos();
                            setSelectedProductos([]);
                            setIsSelectMode(false);
                            alert('Productos activados exitosamente');
                          } catch (error) {
                            alert(`Error: ${error.message}`);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Activar
                    </button>
                  )}

                  {tieneActivos && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Desactivar ${productosSeleccionados.filter(p => p.activo !== false).length} producto(s)?`)) {
                          try {
                            for (const producto of productosSeleccionados) {
                              if (producto.activo !== false) {
                                await productService.toggleStatus(producto.id);
                              }
                            }
                            await fetchProductos();
                            setSelectedProductos([]);
                            setIsSelectMode(false);
                            alert('Productos desactivados exitosamente');
                          } catch (error) {
                            alert(`Error: ${error.message}`);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Desactivar
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      const activosSeleccionados = productosSeleccionados.filter(p => p.activo !== false).length;
                      const mensaje = activosSeleccionados > 0
                        ? `Se eliminarán ${selectedProductos.length} producto(s). ${activosSeleccionados} están activos. ¿Continuar?`
                        : `¿ELIMINAR permanentemente ${selectedProductos.length} producto(s) inactivo(s)? Esta acción no se puede deshacer.`;
                      if (window.confirm(mensaje)) {
                        try {
                          let errores = 0;
                          for (const productoId of selectedProductos) {
                            try {
                              await productService.deleteProduct(productoId);
                            } catch (error) {
                              console.error(`Error al eliminar producto ${productoId}:`, error);
                              errores++;
                            }
                          }

                          // También eliminar de localStorage
                          let todosLosProductos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
                          todosLosProductos = todosLosProductos.filter(p => !selectedProductos.includes(p.id));
                          localStorage.setItem('todolosproductos', JSON.stringify(todosLosProductos));

                          await fetchProductos();
                          setSelectedProductos([]);
                          setIsSelectMode(false);

                          if (errores === 0) {
                            alert(`${selectedProductos.length} producto(s) eliminado(s) exitosamente`);
                          } else {
                            alert(`Eliminación completada con ${errores} error(es)`);
                          }
                        } catch (error) {
                          console.error('Error al eliminar productos:', error);
                          alert(`Error: ${error.message || 'Error desconocido'}`);
                        }
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Eliminar
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Filtros rápidos */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Botón ciclable Todos/Activos/Inactivos */}
        <button
          onClick={() => {
            const nextMode = viewMode === 'all' ? 'active' : viewMode === 'active' ? 'inactive' : 'all';
            setViewMode(nextMode);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: viewMode === 'active' ? '#10B981' : viewMode === 'inactive' ? '#EF4444' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            minWidth: '90px'
          }}
        >
          {viewMode === 'all' ? 'Todos' : viewMode === 'active' ? 'Activos' : 'Inactivos'}
        </button>

        {/* Botón ciclable Stock Crítico/Stock Bajo */}
        <button
          onClick={() => {
            const nextFilter = quickFilter === 'todos' ? 'stock-critico' : quickFilter === 'stock-critico' ? 'stock-bajo' : 'todos';
            setQuickFilter(nextFilter);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: quickFilter === 'stock-critico' ? '#EF4444' : quickFilter === 'stock-bajo' ? '#F59E0B' : '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            minWidth: '140px'
          }}
        >
          {quickFilter === 'stock-critico' ? 'Stock Crítico (<5)' : quickFilter === 'stock-bajo' ? 'Stock Bajo (<10)' : 'Filtro Stock'}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)'
            }}>
              {isSelectMode && (
                <th style={{ padding: '18px 15px', textAlign: 'center', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={currentProductos.length > 0 && currentProductos.every(p => selectedProductos.includes(p.id))}
                    onChange={selectAllProductos}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '10%' }}>Código</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '25%' }}>Nombre/Descripción</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '12%' }}>Precio</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '8%' }}>Stock</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '15%' }}>Categoría</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '15%' }}>Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {currentProductos.length === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? "7" : "6"} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos registrados'}
                </td>
              </tr>
            ) : (
              currentProductos.map((producto) => (
                <tr
                  key={producto.id}
                  style={{
                    borderBottom: '1px solid #f1f3f4',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {isSelectMode && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedProductos.includes(producto.id)}
                        onChange={() => toggleSelectProducto(producto.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td style={{ padding: '12px' }}>{producto.codigo}</td>
                  <td style={{ padding: '12px' }}>{producto.nombre}</td>
                  <td style={{ padding: '12px', width: '120px', minWidth: '120px', whiteSpace: 'nowrap' }}>{formatCurrency(producto.precio)}</td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: producto.stock < 5 ? '#FEE2E2' : producto.stock < 10 ? '#FEF3C7' : '#D1FAE5',
                    color: producto.stock < 5 ? '#DC2626' : producto.stock < 10 ? '#D97706' : '#059669',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {producto.stock}
                  </td>
                  <td style={{ padding: '12px' }}>{producto.categoria}</td>
                  <td style={{ padding: '12px' }}>{producto.proveedor || 'Sin proveedor'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

    </div>
  );
}

export default ListarProductos;
