import React, { useState } from 'react';
import '../styles/AgregarCliente.css';
import { apiService } from '../services/api';

function AgregarCliente() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    cedula: '',
    tipo_documento: 'CI'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      setLoading(false);
      return;
    }

    try {
      const nuevoCliente = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
        cedula: formData.cedula.trim() || null,
        tipo_documento: formData.tipo_documento
      };

      await apiService.post('/api/clientes', nuevoCliente);
      alert('Cliente agregado exitosamente');

      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        cedula: '',
        tipo_documento: 'CI'
      });

      // Redirigir a la lista de clientes
      window.location.assign('/panel/clientes');
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert(error.message || 'No se pudo crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agregar-cliente-container">
      <div className="agregar-cliente-header">
        <h1>Gestión de Clientes</h1>
        <button className="btn-cancel" onClick={() => window.history.back()}>Cancelar</button>
      </div>

      <div className="form-card">
        <h3>Agregar Nuevo Cliente</h3>
        <form onSubmit={handleSubmit} className="cliente-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="juan@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="0981-123-456"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select name="tipo_documento" value={formData.tipo_documento} onChange={handleChange}>
                <option value="CI">Cédula de Identidad</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de Documento</label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="1234567"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Dirección</label>
              <textarea
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Calle, número, barrio, ciudad"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-reset" onClick={() => window.history.back()}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgregarCliente;
