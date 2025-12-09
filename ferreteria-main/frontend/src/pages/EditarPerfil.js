import React, { useState, useEffect } from 'react';
import '../styles/EditarPerfil.css';

function EditarPerfil() {
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    // Cargar datos actuales del usuario
    const currentUsername = localStorage.getItem('adminUsername') || 'Administrador';
    setFormData(prev => ({
      ...prev,
      username: currentUsername
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setMessage('El nombre de usuario es obligatorio');
      setMessageType('error');
      return false;
    }
    
    if (formData.username.length < 3) {
      setMessage('El nombre de usuario debe tener al menos 3 caracteres');
      setMessageType('error');
      return false;
    }

    // Si se quiere cambiar contraseña
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setMessage('Ingresa tu contraseña actual para cambiar la contraseña');
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
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      // Simular guardado de perfil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentStoredPassword = localStorage.getItem('adminPassword') || 'admin123';
      
      // Si se quiere cambiar contraseña, verificar la actual
      if (formData.newPassword) {
        if (formData.currentPassword !== currentStoredPassword) {
          setMessage('La contraseña actual es incorrecta');
          setMessageType('error');
          setIsLoading(false);
          return;
        }
        // Guardar nueva contraseña
        localStorage.setItem('adminPassword', formData.newPassword);
      }
      
      // Guardar nuevo nombre de usuario
      localStorage.setItem('adminUsername', formData.username);
      
      setMessage('Perfil actualizado exitosamente');
      setMessageType('success');
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      // Recargar la página para actualizar el sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      setMessage('Error al actualizar el perfil. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="editar-perfil-container">
      <div className="editar-perfil-header">
        <h1>Editar Perfil de Administrador</h1>
        <p>Actualiza tu información de usuario y contraseña</p>
      </div>

      <form className="perfil-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Información de Usuario</h3>
          
          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
              minLength="3"
              maxLength="20"
            />
            <small className="form-hint">Mínimo 3 caracteres, máximo 20</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Cambiar Contraseña (Opcional)</h3>
          <p className="section-note">Deja estos campos vacíos si no deseas cambiar la contraseña</p>
          
          <div className="form-group">
            <label htmlFor="currentPassword">Contraseña Actual</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="form-input"
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
            />
          </div>
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
            {isLoading ? 'Guardando...' : 'Actualizar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarPerfil;