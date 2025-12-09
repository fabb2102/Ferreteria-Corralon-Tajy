import React, { useState, useEffect } from 'react';
import '../styles/ConfiguracionSeguridad.css';

function ConfiguracionSeguridad() {
  const [settings, setSettings] = useState({
    sessionTimeout: 30,
    requirePasswordConfirm: true,
    enableLoginNotifications: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableSecurityLogs: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem('securitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Simular guardado de configuración
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar en localStorage
      localStorage.setItem('securitySettings', JSON.stringify(settings));
      
      setMessage('Configuración de seguridad actualizada exitosamente');
      setMessageType('success');
    } catch (error) {
      setMessage('Error al guardar la configuración. Intenta nuevamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      sessionTimeout: 30,
      requirePasswordConfirm: true,
      enableLoginNotifications: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      enableSecurityLogs: true
    };
    setSettings(defaultSettings);
    setMessage('Configuración restaurada a valores por defecto');
    setMessageType('info');
  };

  return (
    <div className="configuracion-seguridad-container">
      <div className="configuracion-seguridad-header">
        <h1>Configuración de Seguridad</h1>
        <p>Gestiona las medidas de seguridad del sistema</p>
      </div>

      <form className="seguridad-form" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Sesión y Autenticación</h3>
          
          <div className="form-group">
            <label htmlFor="sessionTimeout">
              Tiempo de sesión (minutos)
            </label>
            <input
              type="number"
              id="sessionTimeout"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleChange}
              className="form-input"
              min="5"
              max="180"
              required
            />
            <small className="form-hint">
              La sesión se cerrará automáticamente después de este tiempo de inactividad
            </small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="requirePasswordConfirm"
                checked={settings.requirePasswordConfirm}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Requerir confirmación de contraseña para acciones críticas
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Control de Acceso</h3>
          
          <div className="form-group">
            <label htmlFor="maxLoginAttempts">
              Máximo intentos de login
            </label>
            <input
              type="number"
              id="maxLoginAttempts"
              name="maxLoginAttempts"
              value={settings.maxLoginAttempts}
              onChange={handleChange}
              className="form-input"
              min="3"
              max="10"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lockoutDuration">
              Duración de bloqueo (minutos)
            </label>
            <input
              type="number"
              id="lockoutDuration"
              name="lockoutDuration"
              value={settings.lockoutDuration}
              onChange={handleChange}
              className="form-input"
              min="5"
              max="60"
              required
            />
            <small className="form-hint">
              Tiempo de bloqueo después de exceder los intentos máximos
            </small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notificaciones y Logs</h3>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="enableLoginNotifications"
                checked={settings.enableLoginNotifications}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Notificar intentos de acceso
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="enableSecurityLogs"
                checked={settings.enableSecurityLogs}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Mantener registros de seguridad
            </label>
          </div>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={resetToDefaults}
            className="btn-secondary"
          >
            Restaurar Valores por Defecto
          </button>
          <button
            type="submit"
            className={`btn-submit ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>

      <div className="security-status">
        <h3>Estado de Seguridad Actual</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Última actualización:</span>
            <span className="status-value">Hace 2 días</span>
          </div>
          <div className="status-item">
            <span className="status-label">Intentos de acceso fallidos:</span>
            <span className="status-value">0</span>
          </div>
          <div className="status-item">
            <span className="status-label">Sesiones activas:</span>
            <span className="status-value">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionSeguridad;