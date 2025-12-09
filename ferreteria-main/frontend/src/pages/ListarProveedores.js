import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Proveedores.css";
import { apiService } from '../services/api';

function ListarProveedores() {
  const { isAdmin } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para selección múltiple
  const [selectedProveedores, setSelectedProveedores] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    ruc: "",
    telefono: "",
    direccion: ""
  });
  const [loadingProvider, setLoadingProvider] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, []);

  useEffect(() => {
    const termino = searchTerm.toLowerCase();
    let filtered = proveedores.filter((p) =>
      p.nombre.toLowerCase().includes(termino) ||
      (p.ruc || '').toLowerCase().includes(termino) ||
      (p.telefono || '').toLowerCase().includes(termino) ||
      (p.direccion || '').toLowerCase().includes(termino)
    );

    // Apply viewMode filter
    if (isAdmin()) {
      if (viewMode === 'active') {
        filtered = filtered.filter(p => p.activo === true || p.activo === undefined);
      } else if (viewMode === 'inactive') {
        filtered = filtered.filter(p => p.activo === false);
      }
    } else {
      // Non-admin users only see active providers
      filtered = filtered.filter(p => p.activo === true || p.activo === undefined);
    }

    setFilteredProveedores(filtered);
    setCurrentPage(1);
  }, [searchTerm, proveedores, viewMode, isAdmin]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/proveedores');

      // Asegurar que todos tengan 'activo' definido
      const proveedoresConActivo = response.map(p => ({
        ...p,
        activo: p.activo !== undefined ? p.activo : true
      }));

      setProveedores(proveedoresConActivo);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingProvider(true);

    try {
      const nuevoProveedor = {
        nombre: formData.nombre.trim(),
        ruc: formData.ruc.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim()
      };

      await apiService.post('/proveedores', nuevoProveedor);
      alert('Proveedor agregado exitosamente');
      setFormData({ nombre: "", ruc: "", telefono: "", direccion: "" });
      fetchProveedores();
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      alert(error.message || 'No se pudo crear el proveedor');
    } finally {
      setLoadingProvider(false);
    }
  };

  // Funciones para selección múltiple
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedProveedores([]);
  };

  const toggleSelectProveedor = (proveedorId) => {
    setSelectedProveedores(prev =>
      prev.includes(proveedorId)
        ? prev.filter(id => id !== proveedorId)
        : [...prev, proveedorId]
    );
  };

  const selectAllProveedores = () => {
    const currentPageIds = currentProveedores.map(p => p.id);
    const allCurrentSelected = currentPageIds.every(id => selectedProveedores.includes(id));

    if (allCurrentSelected) {
      setSelectedProveedores(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedProveedores(prev => {
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

  const toggleProveedorStatus = async (proveedorId) => {
    try {
      await apiService.patch(`/proveedores/${proveedorId}/toggle-status`);
      await fetchProveedores();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error.message || 'Error al cambiar estado del proveedor');
    }
  };

  const deleteProveedor = async (proveedorId) => {
    try {
      await apiService.delete(`/proveedores/${proveedorId}`);
      await fetchProveedores();
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw error;
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProveedores = filteredProveedores.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredProveedores.length / itemsPerPage));

  const Pagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Mostrando {filteredProveedores.length === 0 ? 0 : indexOfFirst + 1} a {Math.min(indexOfLast, filteredProveedores.length)} de {filteredProveedores.length} proveedores
        </div>
        <div className="pagination">
          <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Primera página">«</button>
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} title="Página anterior">‹</button>
          {pageNumbers.map((n) => (
            <button key={n} className={`pagination-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
          ))}
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} title="Página siguiente">›</button>
          <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Última página">»</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="content">
        <h1>GESTIÓN DE PROVEEDORES</h1>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="content">
      <h1>Gestión de Proveedores</h1>

      {isAdmin() && (
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3>Agregar Nuevo Proveedor</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Nombre del Proveedor</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Distribuidora Central S.A." required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>RUC</label>
              <input type="text" name="ruc" value={formData.ruc} onChange={handleChange} placeholder="80012345-7" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Teléfono</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="021-555-0000" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Dirección</label>
              <textarea name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Av. Mariscal López 1234, Asunción" rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
              <button type="submit" disabled={loadingProvider} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingProvider ? 'not-allowed' : 'pointer', opacity: loadingProvider ? 0.7 : 1 }}>
                {loadingProvider ? 'Guardando...' : 'Guardar Proveedor'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="search-container" style={{ flex: 1, marginRight: '20px' }}>
            <input type="text" placeholder="Buscar proveedores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
          {isAdmin() && currentProveedores.length > 0 && (
            <button onClick={toggleSelectMode} style={{ padding: '8px 16px', backgroundColor: isSelectMode ? '#EF4444' : '#6B7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
              {isSelectMode ? 'Cancelar' : 'Seleccionar'}
            </button>
          )}
        </div>

        {/* Controles de selección múltiple */}
        {isAdmin() && isSelectMode && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F3F4F6', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{selectedProveedores.length} seleccionado{selectedProveedores.length !== 1 ? 's' : ''}</span>
            <button onClick={selectAllProveedores} style={{ padding: '6px 12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
              {currentProveedores.every(p => selectedProveedores.includes(p.id)) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>

            {selectedProveedores.length > 0 && (() => {
              const proveedoresSeleccionados = proveedores.filter(p => selectedProveedores.includes(p.id));
              const tieneInactivos = proveedoresSeleccionados.some(p => p.activo === false);
              const tieneActivos = proveedoresSeleccionados.some(p => p.activo !== false);

              return (
                <>
                  {tieneInactivos && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Activar ${proveedoresSeleccionados.filter(p => p.activo === false).length} proveedor(es)?`)) {
                          try {
                            for (const proveedor of proveedoresSeleccionados) {
                              if (proveedor.activo === false) {
                                await toggleProveedorStatus(proveedor.id);
                              }
                            }
                            await fetchProveedores();
                            setSelectedProveedores([]);
                            setIsSelectMode(false);
                            alert('Proveedores activados exitosamente');
                          } catch (error) {
                            alert(`Error: ${error.message}`);
                          }
                        }
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Activar
                    </button>
                  )}

                  {tieneActivos && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Desactivar ${proveedoresSeleccionados.filter(p => p.activo !== false).length} proveedor(es)?`)) {
                          try {
                            for (const proveedor of proveedoresSeleccionados) {
                              if (proveedor.activo !== false) {
                                await toggleProveedorStatus(proveedor.id);
                              }
                            }
                            await fetchProveedores();
                            setSelectedProveedores([]);
                            setIsSelectMode(false);
                            alert('Proveedores desactivados exitosamente');
                          } catch (error) {
                            alert(`Error: ${error.message}`);
                          }
                        }
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#F59E0B', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Desactivar
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      const inactivosSeleccionados = proveedoresSeleccionados.filter(p => p.activo === false);
                      const activosSeleccionados = proveedoresSeleccionados.filter(p => p.activo !== false);

                      if (activosSeleccionados.length > 0) {
                        alert(`No se puede eliminar. Hay ${activosSeleccionados.length} proveedor(es) activo(s) seleccionado(s). Solo se pueden eliminar proveedores inactivos.`);
                        return;
                      }

                      if (window.confirm(`¿ELIMINAR permanentemente ${inactivosSeleccionados.length} proveedor(es) inactivo(s)? Esta acción no se puede deshacer.`)) {
                        try {
                          let errores = 0;
                          for (const proveedorId of selectedProveedores) {
                            try {
                              await deleteProveedor(proveedorId);
                            } catch (error) {
                              console.error(`Error al eliminar proveedor ${proveedorId}:`, error);
                              errores++;
                            }
                          }

                          await fetchProveedores();
                          setSelectedProveedores([]);
                          setIsSelectMode(false);

                          if (errores === 0) {
                            alert(`${selectedProveedores.length} proveedor(es) eliminado(s) exitosamente`);
                          } else {
                            alert(`Eliminación completada con ${errores} error(es)`);
                          }
                        } catch (error) {
                          console.error('Error al eliminar proveedores:', error);
                          alert(`Error: ${error.message || 'Error desconocido'}`);
                        }
                      }
                    }}
                    style={{ padding: '6px 12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Eliminar
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Filtros */}
      {isAdmin() && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const nextMode = viewMode === 'all' ? 'active' : viewMode === 'active' ? 'inactive' : 'all';
              setViewMode(nextMode);
            }}
            style={{ padding: '8px 16px', backgroundColor: viewMode === 'active' ? '#10B981' : viewMode === 'inactive' ? '#EF4444' : '#3B82F6', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', minWidth: '90px' }}
          >
            {viewMode === 'all' ? 'Todos' : viewMode === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #2c3646 0%, #2c3646 100%)' }}>
              {isSelectMode && (
                <th style={{ padding: '18px 15px', textAlign: 'center', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px', width: '40px' }}>
                  <input type="checkbox" checked={currentProveedores.length > 0 && currentProveedores.every(p => selectedProveedores.includes(p.id))} onChange={selectAllProveedores} style={{ cursor: 'pointer' }} />
                </th>
              )}
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>ID</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Nombre</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>RUC</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Teléfono</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Dirección</th>
            </tr>
          </thead>
          <tbody>
            {currentProveedores.length === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? 6 : 5} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {searchTerm ? 'No se encontraron proveedores que coincidan con la búsqueda' : 'No hay proveedores registrados'}
                </td>
              </tr>
            ) : (
              currentProveedores.map((proveedor) => (
                <tr key={proveedor.id} style={{ borderBottom: '1px solid #f1f3f4', opacity: proveedor.activo === false ? 0.5 : 1, backgroundColor: proveedor.activo === false ? '#f9fafb' : 'transparent' }}>
                  {isSelectMode && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedProveedores.includes(proveedor.id)} onChange={() => toggleSelectProveedor(proveedor.id)} style={{ cursor: 'pointer' }} />
                    </td>
                  )}
                  <td style={{ padding: '12px' }}>{proveedor.id}</td>
                  <td style={{ padding: '12px' }}>
                    {proveedor.nombre}
                    {proveedor.activo === false && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>INACTIVO</span>}
                  </td>
                  <td style={{ padding: '12px' }}>{proveedor.ruc || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{proveedor.telefono || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{proveedor.direccion || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination />}
    </div>
  );
}

export default ListarProveedores;
