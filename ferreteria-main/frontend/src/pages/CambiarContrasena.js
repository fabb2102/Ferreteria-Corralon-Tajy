import React, { useState } from 'react';
import '../styles/CambiarContrasena.css';

function CambiarContrasena() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setMessage('Ingresa tu contraseña actual');
      setMessageType('error');
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage('La nueva contraseña debe tener al menos 6 caracteres');
      setMessageType('error');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las nuevas contraseñas no coinciden');
      setMessageType('error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      // Simular validación de contraseña actual
      const currentStoredPassword = localStorage.getItem('adminPassword') || 'admin123';
      
      if (formData.currentPassword !== currentStoredPassword) {
        setMessage('La contraseña actual es incorrecta');
        setMessageType('error');
        setIsLoading(false);
        return;
      }
      
      // Simular cambio de contraseña
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar nueva contraseña
      localStorage.setItem('adminPassword', formData.newPassword);
      
      setMessage('Contraseña cambiada exitosamente');
      setMessageType('success');
      
      // Limpiar formulario
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      setMessage('Error al cambiar la contraseña. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cambiar-contrasena-container">
      <div className="cambiar-contrasena-header">
        <h1>Cambiar Contraseña</h1>
        <p>Actualiza tu contraseña de administrador</p>
      </div>

      <form className="contrasena-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Contraseña Actual</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">Nueva Contraseña</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="form-input"
            required
          />
          <small className="form-hint">Mínimo 6 caracteres</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className={`btn-submit ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CambiarContrasena;