import React, { useState } from 'react';
import '../pages/Articulos.css';

function RecuperarContrasena() {
  const [formData, setFormData] = useState({
    email: '',
    preguntaSecuridad: '',
    respuestaSeguridad: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [paso, setPaso] = useState(1);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitEmail = (e) => {
    e.preventDefault();
    if (!formData.email) {
      setMensaje('Por favor ingrese su email');
      return;
    }
    
    // Inicializar usuarios predeterminados si no existen
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    
    // Crear usuario administrador por defecto si no existe
    if (usuarios.length === 0) {
      const usuarioAdmin = {
        id: 1,
        email: 'admin@ferreteria.com',
        username: 'admin',
        password: 'admin123',
        preguntaSeguridad: '¿Cuál es el nombre de su primera mascota?',
        respuestaSeguridad: 'toby',
        role: 'admin',
        nombre: 'Administrador',
        createdAt: new Date().toISOString()
      };
      usuarios.push(usuarioAdmin);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
    
    const usuario = usuarios.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    
    if (!usuario) {
      setMensaje('Email no encontrado en el sistema');
      return;
    }
    
    setMensaje('');
    setPaso(2);
  };

  const handleSubmitPregunta = (e) => {
    e.preventDefault();
    if (!formData.respuestaSeguridad) {
      setMensaje('Por favor ingrese la respuesta a la pregunta de seguridad');
      return;
    }
    
    // Verificar respuesta de seguridad
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const usuario = usuarios.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    
    if (!usuario || usuario.respuestaSeguridad.toLowerCase() !== formData.respuestaSeguridad.toLowerCase()) {
      setMensaje('Respuesta de seguridad incorrecta');
      return;
    }
    
    setMensaje('');
    setPaso(3);
  };

  const handleSubmitNuevaContrasena = (e) => {
    e.preventDefault();
    
    if (!formData.nuevaContrasena || !formData.confirmarContrasena) {
      setMensaje('Por favor complete todos los campos');
      return;
    }
    
    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }
    
    if (formData.nuevaContrasena.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Simular actualización de contraseña
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const usuarioIndex = usuarios.findIndex(u => u.email === formData.email);
    
    if (usuarioIndex !== -1) {
      usuarios[usuarioIndex].password = formData.nuevaContrasena;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
    
    setMensaje('Contraseña actualizada exitosamente');
    
    setTimeout(() => {
      setFormData({
        email: '',
        preguntaSecuridad: '',
        respuestaSeguridad: '',
        nuevaContrasena: '',
        confirmarContrasena: ''
      });
      setPaso(1);
      setMensaje('');
    }, 2000);
  };

  return (
    <div className="content">
      <h1>Recuperar Contraseña</h1>
      
      <div className="form-card" style={{marginBottom: '20px', backgroundColor: '#e3f2fd', border: '2px solid #2196f3'}}>
        <h3 style={{color: '#1565c0'}}>Credenciales de Prueba</h3>
        <p><strong>Email:</strong> admin@ferreteria.com</p>
        <p><strong>Pregunta de Seguridad:</strong> ¿Cuál es el nombre de su primera mascota?</p>
        <p><strong>Respuesta:</strong> toby</p>
      </div>
      
      {paso === 1 && (
        <div className="form-card">
          <h3>Paso 1: Verificación de Email</h3>
          <form onSubmit={handleSubmitEmail}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ingrese su email"
                required
              />
            </div>
            <button type="submit">Continuar</button>
          </form>
        </div>
      )}

      {paso === 2 && (
        <div className="form-card">
          <h3>Paso 2: Pregunta de Seguridad</h3>
          <div className="form-group">
            <label>Pregunta de Seguridad:</label>
            <p style={{background: '#f8f9fa', padding: '10px', borderRadius: '6px', marginBottom: '15px'}}>
              ¿Cuál es el nombre de su primera mascota?
            </p>
          </div>
          <form onSubmit={handleSubmitPregunta}>
            <div className="form-group">
              <label htmlFor="respuestaSeguridad">Respuesta:</label>
              <input
                type="text"
                id="respuestaSeguridad"
                name="respuestaSeguridad"
                value={formData.respuestaSeguridad}
                onChange={handleInputChange}
                placeholder="Ingrese su respuesta"
                required
              />
            </div>
            <button type="submit">Continuar</button>
            <button type="button" onClick={() => setPaso(1)} style={{marginLeft: '10px', background: '#6c757d'}}>
              Volver
            </button>
          </form>
        </div>
      )}

      {paso === 3 && (
        <div className="form-card">
          <h3>Paso 3: Nueva Contraseña</h3>
          <form onSubmit={handleSubmitNuevaContrasena}>
            <div className="form-group">
              <label htmlFor="nuevaContrasena">Nueva Contraseña:</label>
              <input
                type="password"
                id="nuevaContrasena"
                name="nuevaContrasena"
                value={formData.nuevaContrasena}
                onChange={handleInputChange}
                placeholder="Ingrese nueva contraseña"
                minLength="6"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmarContrasena">Confirmar Contraseña:</label>
              <input
                type="password"
                id="confirmarContrasena"
                name="confirmarContrasena"
                value={formData.confirmarContrasena}
                onChange={handleInputChange}
                placeholder="Confirme la nueva contraseña"
                minLength="6"
                required
              />
            </div>
            <button type="submit">Actualizar Contraseña</button>
            <button type="button" onClick={() => setPaso(2)} style={{marginLeft: '10px', background: '#6c757d'}}>
              Volver
            </button>
          </form>
        </div>
      )}

      {mensaje && (
        <div className={mensaje.includes('exitosamente') ? 'success-message' : 'error-message'}>
          {mensaje}
        </div>
      )}
    </div>
  );
}

export default RecuperarContrasena;