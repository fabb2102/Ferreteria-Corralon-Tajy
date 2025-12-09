import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Articulos.css";
import { apiService } from '../services/api';

function ListarClientes() {
  const { isAdmin, canEditClientes } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'active' | 'inactive'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para selección múltiple
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: ""
  });
  const [loadingCliente, setLoadingCliente] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const termino = searchTerm.toLowerCase();
    let filtered = clientes.filter((c) =>
      c.nombre.toLowerCase().includes(termino) ||
      (c.email || '').toLowerCase().includes(termino) ||
      (c.telefono || '').toLowerCase().includes(termino) ||
      (c.direccion || '').toLowerCase().includes(termino)
    );

    // Apply viewMode filter
    if (isAdmin()) {
      if (viewMode === 'active') {
        filtered = filtered.filter(c => c.activo === true || c.activo === undefined);
      } else if (viewMode === 'inactive') {
        filtered = filtered.filter(c => c.activo === false);
      }
    } else {
      // Non-admin users only see active clients
      filtered = filtered.filter(c => c.activo === true || c.activo === undefined);
    }

    setFilteredClientes(filtered);
    setCurrentPage(1);
  }, [searchTerm, clientes, viewMode, isAdmin]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/clientes');

      // Asegurar que todos tengan 'activo' definido
      const clientesConActivo = response.map(c => ({
        ...c,
        activo: c.activo !== undefined ? c.activo : true
      }));

      setClientes(clientesConActivo);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setClientes([]);
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
    setLoadingCliente(true);

    try {
      const nuevoCliente = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim()
      };

      await apiService.post('/clientes', nuevoCliente);
      alert('Cliente agregado exitosamente');
      setFormData({ nombre: "", email: "", telefono: "", direccion: "" });
      fetchClientes();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert(error.message || 'No se pudo crear el cliente');
    } finally {
      setLoadingCliente(false);
    }
  };

  // Funciones para selección múltiple
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedClientes([]);
  };

  const toggleSelectCliente = (clienteId) => {
    setSelectedClientes(prev =>
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const selectAllClientes = () => {
    const currentPageIds = currentClientes.map(c => c.id);
    const allCurrentSelected = currentPageIds.every(id => selectedClientes.includes(id));

    if (allCurrentSelected) {
      setSelectedClientes(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedClientes(prev => {
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

  const toggleClienteStatus = async (clienteId) => {
    try {
      await apiService.patch(`/clientes/${clienteId}/toggle-status`);
      await fetchClientes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error.message || 'Error al cambiar estado del cliente');
    }
  };

  const deleteCliente = async (clienteId) => {
    try {
      await apiService.delete(`/clientes/${clienteId}`);
      await fetchClientes();
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw error;
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentClientes = filteredClientes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredClientes.length / itemsPerPage));

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
          Mostrando {filteredClientes.length === 0 ? 0 : indexOfFirst + 1} a {Math.min(indexOfLast, filteredClientes.length)} de {filteredClientes.length} clientes
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
        <h1>GESTIÓN DE CLIENTES</h1>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="content">
      <h1>Gestión de Clientes</h1>

      {canEditClientes() && (
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3>Agregar Nuevo Cliente</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Nombre del Cliente</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez" required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="juan@email.com" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Teléfono</label>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="0981-123-456" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Dirección</label>
              <textarea name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle, número, barrio, ciudad" rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #dee2e6' }}>
              <button type="submit" disabled={loadingCliente} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingCliente ? 'not-allowed' : 'pointer', opacity: loadingCliente ? 0.7 : 1 }}>
                {loadingCliente ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="search-container" style={{ flex: 1, marginRight: '20px' }}>
            <input type="text" placeholder="Buscar clientes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
          {isAdmin() && currentClientes.length > 0 && (
            <button onClick={toggleSelectMode} style={{ padding: '8px 16px', backgroundColor: isSelectMode ? '#EF4444' : '#6B7280', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
              {isSelectMode ? 'Cancelar' : 'Seleccionar'}
            </button>
          )}
        </div>

        {/* Controles de selección múltiple */}
        {isAdmin() && isSelectMode && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F3F4F6', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{selectedClientes.length} seleccionado{selectedClientes.length !== 1 ? 's' : ''}</span>
            <button onClick={selectAllClientes} style={{ padding: '6px 12px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
              {currentClientes.every(c => selectedClientes.includes(c.id)) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </button>

            {selectedClientes.length > 0 && (() => {
              const clientesSeleccionados = clientes.filter(c => selectedClientes.includes(c.id));
              const tieneInactivos = clientesSeleccionados.some(c => c.activo === false);
              const tieneActivos = clientesSeleccionados.some(c => c.activo !== false);

              return (
                <>
                  {tieneInactivos && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Activar ${clientesSeleccionados.filter(c => c.activo === false).length} cliente(s)?`)) {
                          try {
                            for (const cliente of clientesSeleccionados) {
                              if (cliente.activo === false) {
                                await toggleClienteStatus(cliente.id);
                              }
                            }
                            await fetchClientes();
                            setSelectedClientes([]);
                            setIsSelectMode(false);
                            alert('Clientes activados exitosamente');
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
                        if (window.confirm(`¿Desactivar ${clientesSeleccionados.filter(c => c.activo !== false).length} cliente(s)?`)) {
                          try {
                            for (const cliente of clientesSeleccionados) {
                              if (cliente.activo !== false) {
                                await toggleClienteStatus(cliente.id);
                              }
                            }
                            await fetchClientes();
                            setSelectedClientes([]);
                            setIsSelectMode(false);
                            alert('Clientes desactivados exitosamente');
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
                      const inactivosSeleccionados = clientesSeleccionados.filter(c => c.activo === false);
                      const activosSeleccionados = clientesSeleccionados.filter(c => c.activo !== false);

                      if (activosSeleccionados.length > 0) {
                        alert(`No se puede eliminar. Hay ${activosSeleccionados.length} cliente(s) activo(s) seleccionado(s). Solo se pueden eliminar clientes inactivos.`);
                        return;
                      }

                      if (window.confirm(`¿ELIMINAR permanentemente ${inactivosSeleccionados.length} cliente(s) inactivo(s)? Esta acción no se puede deshacer.`)) {
                        try {
                          let errores = 0;
                          for (const clienteId of selectedClientes) {
                            try {
                              await deleteCliente(clienteId);
                            } catch (error) {
                              console.error(`Error al eliminar cliente ${clienteId}:`, error);
                              errores++;
                            }
                          }

                          await fetchClientes();
                          setSelectedClientes([]);
                          setIsSelectMode(false);

                          if (errores === 0) {
                            alert(`${selectedClientes.length} cliente(s) eliminado(s) exitosamente`);
                          } else {
                            alert(`Eliminación completada con ${errores} error(es)`);
                          }
                        } catch (error) {
                          console.error('Error al eliminar clientes:', error);
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
                  <input type="checkbox" checked={currentClientes.length > 0 && currentClientes.every(c => selectedClientes.includes(c.id))} onChange={selectAllClientes} style={{ cursor: 'pointer' }} />
                </th>
              )}
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>ID</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Nombre</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Email</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Teléfono</th>
              <th style={{ padding: '18px 15px', textAlign: 'left', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '14px' }}>Dirección</th>
            </tr>
          </thead>
          <tbody>
            {currentClientes.length === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? 6 : 5} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                </td>
              </tr>
            ) : (
              currentClientes.map((cliente) => (
                <tr key={cliente.id} style={{ borderBottom: '1px solid #f1f3f4', opacity: cliente.activo === false ? 0.5 : 1, backgroundColor: cliente.activo === false ? '#f9fafb' : 'transparent' }}>
                  {isSelectMode && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={selectedClientes.includes(cliente.id)} onChange={() => toggleSelectCliente(cliente.id)} style={{ cursor: 'pointer' }} />
                    </td>
                  )}
                  <td style={{ padding: '12px' }}>{cliente.id}</td>
                  <td style={{ padding: '12px' }}>
                    {cliente.nombre}
                    {cliente.activo === false && <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>INACTIVO</span>}
                  </td>
                  <td style={{ padding: '12px' }}>{cliente.email || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{cliente.telefono || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{cliente.direccion || 'N/A'}</td>
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

export default ListarClientes;
