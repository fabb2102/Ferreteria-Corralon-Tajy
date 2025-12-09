const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('./config/database'); // Importar conexión a PostgreSQL

const app = express();
app.use(cors());
app.use(express.json());

// JWT secret key (in production, use environment variable)
const JWT_SECRET = 'ferreteria_secret_key_2024';

// Helper function to hash passwords with MD5
const hashPasswordMD5 = (plainPassword) => {
  return crypto.createHash('md5').update(plainPassword).digest('hex');
};

// Helper function to hash passwords for new users (bcrypt - deprecated)
// Usage: const hashedPassword = await hashPassword('plaintext123');
const hashPassword = async (plainPassword) => {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
};

// TODO: When implementing user creation/editing endpoints, use hashPasswordMD5()
// Example:
// app.post('/api/usuarios', async (req, res) => {
//   const { email, password, nombre, rolId } = req.body;
//   const hashedPassword = hashPasswordMD5(password);
//   // Save user with hashedPassword (MD5) instead of plain password
// });

// Mock data stores (replace with database in production)
let productos = [
  { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, costo: 15000, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A', activo: true },
  { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, costo: 7000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B', activo: true },
  { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, costo: 3000, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C', activo: true }
];

let clientes = [
  { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '123-456-7890' },
  { id: 2, nombre: 'María García', email: 'maria@email.com', telefono: '987-654-3210' },
  { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', telefono: '555-123-4567' }
];

// Roles and Users data
let roles = [
  { id: 1, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
  { id: 2, nombre: 'Vendedor', descripcion: 'Puede gestionar ventas y clientes' }
];

// Default users (passwords hashed with MD5)
let usuarios = [
  { 
    id: 1, 
    email: 'admin@ferreteria.com', 
    password: '0192023a7bbd73250516f069df18b500', // admin123 MD5
    nombre: 'Administrador', 
    rolId: 1,
    activo: true,
    fechaCreacion: '2024-01-01T00:00:00.000Z',
    ultimoAcceso: new Date().toISOString()
  },
  { 
    id: 2, 
    email: 'vendedor@ferreteria.com', 
    password: 'a60c36fc7c825e68bb5371a0e08f828a', // vendedor123 MD5
    nombre: 'Juan Vendedor', 
    rolId: 2,
    activo: true,
    fechaCreacion: '2024-01-01T00:00:00.000Z',
    ultimoAcceso: '2024-10-15T10:30:00.000Z'
  }
];

let ventas = [];
let nextVentaId = 1;
let nextProductoId = 4;
let nextClienteId = 4;
let nextUsuarioId = 3;

// Proveedores data
let proveedores = [
  { id: 1, nombre: 'Distribuidora Central S.A.', ruc: '80012345-7', telefono: '021-555-0001', direccion: 'Av. Mariscal López 1234, Asunción' },
  { id: 2, nombre: 'Ferretería Industrial del Este', ruc: '80023456-8', telefono: '061-444-0002', direccion: 'Ruta 2 Km 15, Ciudad del Este' },
  { id: 3, nombre: 'Pinturas y Acabados SA', ruc: '80034567-9', telefono: '021-333-0003', direccion: 'Av. España 567, Asunción' }
];

// Compras data
let compras = [];
let nextProveedorId = 4;
let nextCompraId = 1;

// Categorías data
let categorias = [
  { id: 1, nombre: 'Herramientas' },
  { id: 2, nombre: 'Materiales de Construcción' },
  { id: 3, nombre: 'Pintura' },
  { id: 4, nombre: 'Electricidad' },
  { id: 5, nombre: 'Plomería' },
  { id: 6, nombre: 'Ferretería General' },
  { id: 7, nombre: 'Jardinería' },
  { id: 8, nombre: 'Seguridad' }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userRole = roles.find(role => role.id === req.user.rolId);

    // Comparación insensible a mayúsculas/minúsculas
    if (allowedRoles.length && userRole?.nombre) {
      const userRoleLower = userRole.nombre.toLowerCase();
      const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRoleLower);

      if (!hasPermission) {
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta acción',
          requiredRoles: allowedRoles,
          userRole: userRole.nombre
        });
      }
    } else if (allowedRoles.length) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        requiredRoles: allowedRoles,
        userRole: 'desconocido'
      });
    }

    next();
  };
};

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    // Find user in PostgreSQL
    const result = await pool.query(
      'SELECT u.id, u.email, u.nombre, u.contrasenha, u.estado, u.rol_id, r.nombre as rol_nombre FROM usuario u LEFT JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0 || !result.rows[0].estado) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];

    // Verify password (support both bcrypt and MD5)
    let passwordValida = false;

    // Check if password is bcrypt hashed
    if (usuario.contrasenha.startsWith('$2a$') || usuario.contrasenha.startsWith('$2b$')) {
      passwordValida = await bcrypt.compare(password, usuario.contrasenha);
    } else {
      // MD5 hash
      const passwordMD5 = hashPasswordMD5(password);
      passwordValida = passwordMD5 === usuario.contrasenha;
    }

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rolId: usuario.rol_id,
        rol: usuario.rol_nombre
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: {
          id: usuario.rol_id,
          nombre: usuario.rol_nombre
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const usuario = usuarios.find(u => u.id === req.user.id);
  const rol = roles.find(r => r.id === usuario.rolId);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: {
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion
    }
  });
});

// Helper function to generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TEMP';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// API Endpoints for Usuarios (User Management)
app.get('/api/usuarios', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const usuariosConRol = usuarios.map(usuario => {
      const rol = roles.find(r => r.id === usuario.rolId);
      const { password, ...usuarioSinPassword } = usuario;
      
      return {
        ...usuarioSinPassword,
        rol: {
          id: rol.id,
          nombre: rol.nombre
        }
      };
    });
    
    res.json(usuariosConRol);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const { nombre, email, password, rolId } = req.body;
    
    // Validaciones
    if (!nombre || !email || !password || !rolId) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Verificar email único
    const emailExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExiste) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Verificar que el rol existe
    const rol = roles.find(r => r.id === parseInt(rolId));
    if (!rol) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    
    // Crear nuevo usuario
    const nuevoUsuario = {
      id: nextUsuarioId++,
      nombre,
      email: email.toLowerCase(),
      password: hashPasswordMD5(password),
      rolId: parseInt(rolId),
      activo: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null
    };
    
    usuarios.push(nuevoUsuario);
    
    // Respuesta sin contraseña hasheada
    const { password: _, ...usuarioRespuesta } = nuevoUsuario;
    res.json({
      usuario: {
        ...usuarioRespuesta,
        rol: {
          id: rol.id,
          nombre: rol.nombre
        }
      },
      credencialesTemporales: {
        email: email,
        password: password,
        mensaje: 'Guarda estas credenciales para entregar al usuario'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.put('/api/usuarios/:id', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, rolId, activo } = req.body;
    
    const usuarioIndex = usuarios.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // No permitir que el admin se desactive a sí mismo
    if (req.user.id === id && activo === false) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }
    
    // Verificar email único (excluyendo el usuario actual)
    if (email) {
      const emailExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
      if (emailExiste) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    // Verificar que el rol existe
    if (rolId) {
      const rol = roles.find(r => r.id === parseInt(rolId));
      if (!rol) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
    }
    
    // Actualizar usuario
    usuarios[usuarioIndex] = {
      ...usuarios[usuarioIndex],
      ...(nombre && { nombre }),
      ...(email && { email: email.toLowerCase() }),
      ...(rolId && { rolId: parseInt(rolId) }),
      ...(activo !== undefined && { activo })
    };
    
    const usuarioActualizado = usuarios[usuarioIndex];
    const rol = roles.find(r => r.id === usuarioActualizado.rolId);
    const { password, ...usuarioSinPassword } = usuarioActualizado;
    
    res.json({
      ...usuarioSinPassword,
      rol: {
        id: rol.id,
        nombre: rol.nombre
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

app.post('/api/usuarios/:id/reset-password', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const usuarioIndex = usuarios.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Generar nueva contraseña temporal
    const nuevaPassword = generateRandomPassword();
    
    // Actualizar contraseña
    usuarios[usuarioIndex].password = hashPasswordMD5(nuevaPassword);
    
    const usuario = usuarios[usuarioIndex];
    
    res.json({
      mensaje: 'Contraseña reseteada exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      },
      nuevasCredenciales: {
        email: usuario.email,
        password: nuevaPassword,
        mensaje: 'Entrega estas credenciales al usuario para que pueda acceder'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

app.patch('/api/usuarios/:id/toggle-status', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const usuarioIndex = usuarios.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir que el admin se desactive a sí mismo
    if (req.user.id === id && usuarios[usuarioIndex].activo === true) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    // Cambiar estado
    usuarios[usuarioIndex].activo = !usuarios[usuarioIndex].activo;

    const usuario = usuarios[usuarioIndex];
    const rol = roles.find(r => r.id === usuario.rolId);
    const { password, ...usuarioSinPassword } = usuario;

    res.json({
      ...usuarioSinPassword,
      rol: {
        id: rol.id,
        nombre: rol.nombre
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
});

app.delete('/api/usuarios/:id', authenticateToken, authorize(['Administrador']), (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const usuarioIndex = usuarios.findIndex(u => u.id === id);
    if (usuarioIndex === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[usuarioIndex];

    // No permitir eliminar la propia cuenta
    if (req.user.id === id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // No permitir eliminar usuarios activos
    if (usuario.activo) {
      return res.status(400).json({ error: 'No se puede eliminar un usuario activo. Desactívalo primero.' });
    }

    // Eliminar usuario
    usuarios.splice(usuarioIndex, 1);

    res.json({
      mensaje: 'Usuario eliminado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

app.get('/api/roles', authenticateToken, authorize(['Administrador']), (req, res) => {
  res.json(roles);
});

// API Endpoints for Categorías
app.get('/api/categorias', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre_cat as nombre FROM categoria ORDER BY nombre_cat');

    // Convertir IDs a números
    const categoriasFormateadas = result.rows.map(c => ({
      id: parseInt(c.id),
      nombre: c.nombre
    }));

    res.json(categoriasFormateadas);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// API Endpoints for Productos
app.get('/api/productos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.codigo,
        p.nombre,
        p.precio_venta as precio,
        p.stock_actual as stock,
        p.id_categoria as categoria_id,
        c.nombre_cat as categoria,
        p.id_proveedor as proveedor_id,
        pr.nombre as proveedor,
        p.activo,
        p.ubicacion
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id
      LEFT JOIN proveedor pr ON p.id_proveedor = pr.id
      ORDER BY p.nombre
    `);

    // Convertir strings a números para mantener compatibilidad con frontend
    const productosFormateados = result.rows.map(p => ({
      id: parseInt(p.id),
      codigo: p.codigo,
      nombre: p.nombre,
      precio: p.precio ? parseFloat(p.precio) : 0,
      stock: parseInt(p.stock) || 0,
      categoria_id: p.categoria_id ? parseInt(p.categoria_id) : null,
      categoria: p.categoria,
      proveedor_id: p.proveedor_id ? parseInt(p.proveedor_id) : null,
      proveedor: p.proveedor,
      activo: p.activo,
      ubicacion: p.ubicacion
    }));

    console.log('🔍 GET /api/productos');
    console.log(`   📊 Total: ${productosFormateados.length} productos`);
    console.log(`   ✅ Activos: ${productosFormateados.filter(p => p.activo).length}`);
    console.log(`   💰 Con precio: ${productosFormateados.filter(p => p.precio && p.precio > 0).length}`);
    console.log(`   📦 Con stock: ${productosFormateados.filter(p => p.stock && p.stock > 0).length}`);

    // Log de primeros 3 productos para debug
    if (productosFormateados.length > 0) {
      console.log('   📋 Muestra (primeros 3):');
      productosFormateados.slice(0, 3).forEach(p => {
        console.log(`      - ID:${p.id} ${p.nombre} $${p.precio} Stock:${p.stock} Activo:${p.activo}`);
      });
    }

    res.json(productosFormateados);
  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/api/productos', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { nombre, precio, costo, stock_inicial, categoria_id, proveedor_id } = req.body;

  console.log('=== CREAR PRODUCTO DEBUG ===');
  console.log('Body recibido:', req.body);

  // Validar nombre y precio (requeridos)
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  }
  if (!precio || parseFloat(precio) <= 0) {
    return res.status(400).json({ error: 'El precio de venta debe ser mayor a cero' });
  }
  if (!categoria_id) {
    return res.status(400).json({ error: 'La categoría es obligatoria' });
  }

  try {
    // Generar código automático
    const countResult = await pool.query('SELECT COUNT(*) FROM producto');
    const count = parseInt(countResult.rows[0].count) + 1;
    const codigoGenerado = `PROD${String(count).padStart(6, '0')}`;

    // Preparar proveedor_id (null si no se proporciona o es inválido)
    const proveedorIdFinal = (proveedor_id && proveedor_id !== '' && proveedor_id !== '0' && proveedor_id !== 0)
      ? parseInt(proveedor_id)
      : null;

    // Insertar producto en PostgreSQL
    const result = await pool.query(`
      INSERT INTO producto (codigo, nombre, precio_venta, stock_actual, id_categoria, id_proveedor, activo)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, codigo, nombre, precio_venta as precio, stock_actual as stock, id_categoria as categoria_id, id_proveedor as proveedor_id, activo
    `, [codigoGenerado, nombre.trim(), parseFloat(precio), stock_inicial ? parseInt(stock_inicial) : 0, parseInt(categoria_id), proveedorIdFinal]);

    const nuevoProducto = result.rows[0];

    // Obtener nombres de categoría y proveedor
    const catResult = await pool.query('SELECT nombre_cat FROM categoria WHERE id = $1', [nuevoProducto.categoria_id]);
    if (catResult.rows.length > 0) {
      nuevoProducto.categoria = catResult.rows[0].nombre_cat;
    }

    if (nuevoProducto.proveedor_id) {
      const provResult = await pool.query('SELECT nombre FROM proveedor WHERE id = $1', [nuevoProducto.proveedor_id]);
      if (provResult.rows.length > 0) {
        nuevoProducto.proveedor = provResult.rows[0].nombre;
      }
    }

    console.log('✅ Producto creado en BD:', nuevoProducto);
    res.json(nuevoProducto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Toggle activo/inactivo sin eliminar
app.patch('/api/productos/:id/toggle-status', authenticateToken, authorize(['Administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Obtener el estado actual
    const current = await pool.query('SELECT activo FROM producto WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Toggle activo
    const nuevoEstado = !current.rows[0].activo;
    const result = await pool.query(
      'UPDATE producto SET activo = $1 WHERE id = $2 RETURNING id, codigo, nombre, activo',
      [nuevoEstado, id]
    );

    console.log(`✅ Producto ${id} ${nuevoEstado ? 'activado' : 'desactivado'}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado del producto:', error);
    res.status(500).json({ error: 'Error al cambiar estado del producto' });
  }
});

app.put('/api/productos/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { codigo, nombre, precio, stock, categoria_id, proveedor_id } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE producto
       SET codigo = $1, nombre = $2, precio_venta = $3, stock_actual = $4, id_categoria = $5, id_proveedor = $6
       WHERE id = $7
       RETURNING id, codigo, nombre, precio_venta as precio, stock_actual as stock, id_categoria as categoria_id, id_proveedor as proveedor_id, activo`,
      [codigo, nombre.trim(), parseFloat(precio), parseInt(stock), categoria_id || null, proveedor_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    console.log('✅ Producto actualizado en BD:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

app.delete('/api/productos/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await pool.query('DELETE FROM producto WHERE id = $1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    console.log('✅ Producto eliminado de BD:', result.rows[0]);
    res.json({ mensaje: 'Producto eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'No se puede eliminar el producto porque está siendo usado en ventas o compras' });
    } else {
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
});

// API Endpoints for Clientes
app.get('/api/clientes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, correo as email, telefono, direccion, COALESCE(activo, true) as activo FROM cliente ORDER BY nombre');

    const clientesFormateados = result.rows.map(c => ({
      id: parseInt(c.id),
      nombre: c.nombre,
      email: c.email,
      telefono: c.telefono,
      direccion: c.direccion,
      activo: c.activo
    }));

    res.json(clientesFormateados);
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/clientes', authenticateToken, authorize(['Administrador', 'Vendedor']), async (req, res) => {
  const { nombre, email, telefono, direccion, cedula, tipo_documento } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO cliente (nombre, correo, telefono, direccion, cedula, tipo_documento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, correo as email, telefono, direccion',
      [nombre.trim(), email || null, telefono || null, direccion || null, cedula || null, tipo_documento || null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// IMPORTANTE: Rutas específicas primero (toggle-status) antes que las genéricas (:id)
app.patch('/api/clientes/:id/toggle-status', authenticateToken, authorize(['Administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Obtener el estado actual (usar true como default si no existe la columna aún)
    const current = await pool.query('SELECT COALESCE(activo, true) as activo FROM cliente WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Toggle activo
    const nuevoEstado = !current.rows[0].activo;
    const result = await pool.query(
      'UPDATE cliente SET activo = $1 WHERE id = $2 RETURNING id, nombre, activo',
      [nuevoEstado, id]
    );

    console.log(`✅ Cliente ${id} ${nuevoEstado ? 'activado' : 'desactivado'}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado del cliente:', error);
    // Si la columna activo no existe, indicar que debe agregarse
    if (error.code === '42703') {
      res.status(500).json({ error: 'La columna activo no existe en la tabla cliente. Ejecuta: ALTER TABLE cliente ADD COLUMN activo BOOLEAN DEFAULT true;' });
    } else {
      res.status(500).json({ error: 'Error al cambiar estado del cliente' });
    }
  }
});

app.put('/api/clientes/:id', authenticateToken, authorize(['Administrador', 'Vendedor']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, email, telefono, direccion, cedula, tipo_documento } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  try {
    const result = await pool.query(
      'UPDATE cliente SET nombre = $1, correo = $2, telefono = $3, direccion = $4, cedula = $5, tipo_documento = $6 WHERE id = $7 RETURNING id, nombre, correo as email, telefono, direccion',
      [nombre.trim(), email || null, telefono || null, direccion || null, cedula || null, tipo_documento || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

app.delete('/api/clientes/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await pool.query('DELETE FROM cliente WHERE id = $1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    if (error.code === '23503') {
      res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene ventas asociadas' });
    } else {
      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }
});

// API Endpoints for Ventas
app.get('/api/ventas', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id,
        v.numero_venta,
        v.fecha_hora as fecha,
        v.cliente as cliente_id,
        c.nombre as cliente_nombre,
        c.cedula as cliente_cedula,
        COALESCE(SUM(iv.subtotal), 0) as total,
        COUNT(iv.id) as items_count
      FROM venta v
      LEFT JOIN cliente c ON v.cliente = c.id
      LEFT JOIN item_venta iv ON iv.id_venta = v.id
      GROUP BY v.id, v.numero_venta, v.fecha_hora, v.cliente, c.nombre, c.cedula
      ORDER BY v.fecha_hora DESC
    `);

    // Obtener items de cada venta
    const ventasConItems = await Promise.all(
      result.rows.map(async (venta) => {
        const items = await pool.query(`
          SELECT
            iv.id,
            iv.cantidad,
            iv.precio_unitario as precio,
            iv.subtotal,
            p.nombre as producto_nombre,
            p.codigo as producto_codigo
          FROM item_venta iv
          LEFT JOIN producto p ON iv.id_producto = p.id
          WHERE iv.id_venta = $1
        `, [venta.id]);

        return {
          ...venta,
          cliente: venta.cliente_nombre || 'Sin cliente',
          clienteId: venta.cliente_id,
          productos: items.rows
        };
      })
    );

    res.json(ventasConItems);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

app.post('/api/ventas', authenticateToken, authorize(['Administrador', 'Vendedor']), async (req, res) => {
  const { clienteId, productos: productosVenta, total } = req.body;

  if (!clienteId) {
    return res.status(400).json({ error: 'Cliente es requerido' });
  }
  if (!productosVenta || productosVenta.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validar cliente existe
    const clienteCheck = await client.query('SELECT id FROM cliente WHERE id = $1', [clienteId]);
    if (clienteCheck.rows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    // Validar stock de productos
    for (const item of productosVenta) {
      const producto = await client.query(
        'SELECT id, nombre, stock_actual FROM producto WHERE id = $1',
        [item.productoId]
      );

      if (producto.rows.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      if (producto.rows[0].stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para ${producto.rows[0].nombre}. Disponible: ${producto.rows[0].stock_actual}`);
      }
    }

    // Generar número de venta
    const fecha = new Date();
    const numeroVenta = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    // Crear venta
    const ventaResult = await client.query(
      'INSERT INTO venta (numero_venta, cliente, fecha_hora) VALUES ($1, $2, NOW()) RETURNING id, numero_venta, fecha_hora',
      [numeroVenta, clienteId]
    );

    const ventaId = ventaResult.rows[0].id;

    // Crear items de venta y actualizar stock
    for (const item of productosVenta) {
      const subtotal = item.cantidad * item.precio;

      // Insertar item
      await client.query(
        'INSERT INTO item_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [ventaId, item.productoId, item.cantidad, item.precio, subtotal]
      );

      // Actualizar stock
      await client.query(
        'UPDATE producto SET stock_actual = stock_actual - $1 WHERE id = $2',
        [item.cantidad, item.productoId]
      );
    }

    await client.query('COMMIT');

    console.log('✅ Venta creada en BD:', ventaResult.rows[0]);

    res.json({
      id: ventaId,
      numero_venta: numeroVenta,
      clienteId,
      productos: productosVenta,
      total,
      fecha: ventaResult.rows[0].fecha_hora
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear venta:', error);
    res.status(400).json({ error: error.message || 'Error al crear venta' });
  } finally {
    client.release();
  }
});

// PDF Generation Endpoint
app.post('/api/comprobantes/:ventaId', authenticateToken, authorize(['Administrador', 'Vendedor']), async (req, res) => {
  const ventaId = parseInt(req.params.ventaId);
  let venta = ventas.find(v => v.id === ventaId);
  
  // If not found in ventas, create mock data for historical comprobantes
  if (!venta) {
    // Mock data for historical comprobantes (IDs 1, 2, 3 from HistorialComprobantes)
    const mockComprobantes = {
      1: {
        id: 1,
        clienteId: 1,
        productos: [{ productoId: 1, cantidad: 1, precio: 187500 }],
        total: 187500,
        fecha: '2023-12-15'
      },
      2: {
        id: 2,
        clienteId: 2,
        productos: [{ productoId: 2, cantidad: 1, precio: 133575 }],
        total: 133575,
        fecha: '2023-12-14'
      },
      3: {
        id: 3,
        clienteId: 3,
        productos: [{ productoId: 3, cantidad: 1, precio: 322613 }],
        total: 322613,
        fecha: '2023-12-13'
      }
    };
    
    venta = mockComprobantes[ventaId];
  }
  
  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }
  
  const cliente = clientes.find(c => c.id === venta.clienteId);
  
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Generate HTML for the invoice
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Comprobante de Venta</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .invoice-title { font-size: 18px; margin-top: 10px; }
          .details { margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .products-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .products-table th, .products-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
          }
          .products-table th { background-color: #f8f9fa; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">FERRETERÍA SISTEMA</div>
          <div class="invoice-title">Comprobante de Venta</div>
        </div>
        
        <div class="details">
          <div class="details-row">
            <strong>No. Factura:</strong>
            <span>${venta.id.toString().padStart(6, '0')}</span>
          </div>
          <div class="details-row">
            <strong>Fecha:</strong>
            <span>${new Date(venta.fecha).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="details-row">
            <strong>Cliente:</strong>
            <span>${cliente ? cliente.nombre : 'Cliente no encontrado'}</span>
          </div>
          <div class="details-row">
            <strong>Email:</strong>
            <span>${cliente ? cliente.email : 'N/A'}</span>
          </div>
        </div>
        
        <table class="products-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${venta.productos.map(item => {
              const producto = productos.find(p => p.id === item.productoId);
              const subtotal = item.cantidad * item.precio;
              return `
                <tr>
                  <td>${producto ? producto.nombre : 'Producto no encontrado'}</td>
                  <td>${item.cantidad}</td>
                  <td>$${item.precio.toFixed(2)}</td>
                  <td>$${subtotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="total">
          <strong>TOTAL: $${venta.total.toFixed(2)}</strong>
        </div>
        
        <div class="footer">
          <p>Gracias por su compra</p>
          <p>Este es un comprobante generado automáticamente</p>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprobante-${ventaId}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

// API Endpoints for Proveedores
app.get('/api/proveedores', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, ruc, telefono, direccion, COALESCE(activo, true) as activo FROM proveedor ORDER BY nombre');

    const proveedoresFormateados = result.rows.map(p => ({
      id: parseInt(p.id),
      nombre: p.nombre,
      ruc: p.ruc,
      telefono: p.telefono,
      direccion: p.direccion,
      activo: p.activo
    }));

    res.json(proveedoresFormateados);
  } catch (error) {
    console.error('❌ Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

app.post('/api/proveedores', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { nombre, ruc, telefono, direccion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO proveedor (nombre, ruc, telefono, direccion) VALUES ($1, $2, $3, $4) RETURNING id, nombre, ruc, telefono, direccion',
      [nombre.trim(), ruc || null, telefono || null, direccion || null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// IMPORTANTE: Rutas específicas primero (toggle-status) antes que las genéricas (:id)
app.patch('/api/proveedores/:id/toggle-status', authenticateToken, authorize(['Administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Obtener el estado actual (usar true como default si no existe la columna aún)
    const current = await pool.query('SELECT COALESCE(activo, true) as activo FROM proveedor WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Toggle activo
    const nuevoEstado = !current.rows[0].activo;
    const result = await pool.query(
      'UPDATE proveedor SET activo = $1 WHERE id = $2 RETURNING id, nombre, activo',
      [nuevoEstado, id]
    );

    console.log(`✅ Proveedor ${id} ${nuevoEstado ? 'activado' : 'desactivado'}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cambiar estado del proveedor:', error);
    // Si la columna activo no existe, indicar que debe agregarse
    if (error.code === '42703') {
      res.status(500).json({ error: 'La columna activo no existe en la tabla proveedor. Ejecuta: ALTER TABLE proveedor ADD COLUMN activo BOOLEAN DEFAULT true;' });
    } else {
      res.status(500).json({ error: 'Error al cambiar estado del proveedor' });
    }
  }
});

app.put('/api/proveedores/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, ruc, telefono, direccion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proveedor es obligatorio' });
  }

  try {
    const result = await pool.query(
      'UPDATE proveedor SET nombre = $1, ruc = $2, telefono = $3, direccion = $4 WHERE id = $5 RETURNING id, nombre, ruc, telefono, direccion',
      [nombre.trim(), ruc || null, telefono || null, direccion || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

app.delete('/api/proveedores/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await pool.query('DELETE FROM proveedor WHERE id = $1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ mensaje: 'Proveedor eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    if (error.code === '23503') {
      res.status(400).json({ error: 'No se puede eliminar el proveedor porque tiene productos o compras asociadas' });
    } else {
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
});

// API Endpoints for Compras
app.get('/api/compras', authenticateToken, authorize(['Administrador']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.proveedor_id,
        c.fecha,
        c.total,
        c.observaciones,
        pr.nombre as proveedor_nombre,
        pr.ruc as ruc_proveedor,
        pr.telefono as telefono_proveedor,
        pr.direccion as direccion_proveedor
      FROM compra c
      LEFT JOIN proveedor pr ON c.proveedor_id = pr.id
      ORDER BY c.fecha DESC
    `);

    // Obtener items de cada compra
    const comprasConItems = await Promise.all(
      result.rows.map(async (compra) => {
        const items = await pool.query(`
          SELECT
            ic.id,
            ic.cantidad,
            ic.precio_costo as precio,
            ic.subtotal,
            p.nombre as producto_nombre,
            p.codigo as producto_codigo
          FROM item_compra ic
          LEFT JOIN producto p ON ic.producto_id = p.id
          WHERE ic.compra_id = $1
        `, [compra.id]);

        return {
          ...compra,
          proveedor: compra.proveedor_nombre || 'Sin proveedor',
          productos: items.rows
        };
      })
    );

    console.log('GET /api/compras - Devolviendo compras:', comprasConItems.length);
    res.json(comprasConItems);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
});

app.post('/api/compras', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { proveedorId, productos: productosCompra, total, observaciones } = req.body;

  console.log('=== COMPRA REQUEST DEBUG ===');
  console.log('Received proveedorId:', proveedorId);
  console.log('Productos de compra:', productosCompra);

  // Validaciones
  if (!proveedorId) {
    return res.status(400).json({ error: 'Proveedor es obligatorio' });
  }

  if (!productosCompra || productosCompra.length === 0) {
    return res.status(400).json({ error: 'Debe agregar al menos un producto a la compra' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validar proveedor existe
    const proveedorCheck = await client.query('SELECT id, nombre FROM proveedor WHERE id = $1', [proveedorId]);
    if (proveedorCheck.rows.length === 0) {
      throw new Error('Proveedor no encontrado');
    }

    // Validar productos
    for (const item of productosCompra) {
      if (!item.productoId) {
        throw new Error('Todos los productos deben estar seleccionados');
      }
      if (!item.cantidad || item.cantidad <= 0) {
        throw new Error('Las cantidades deben ser mayores a cero');
      }
      if (!item.costo || item.costo <= 0) {
        throw new Error('Los costos deben ser mayores a cero');
      }

      const producto = await client.query('SELECT id, nombre FROM producto WHERE id = $1', [item.productoId]);
      if (producto.rows.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
    }

    // Crear compra
    const compraResult = await client.query(
      'INSERT INTO compra (proveedor_id, usuario_id, total, observaciones, fecha) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, fecha',
      [proveedorId, req.user.id, total, observaciones || null]
    );

    const compraId = compraResult.rows[0].id;

    // Crear items de compra y actualizar stock
    for (const item of productosCompra) {
      const subtotal = item.cantidad * item.costo;

      // Insertar item
      await client.query(
        'INSERT INTO item_compra (compra_id, producto_id, cantidad, precio_costo, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [compraId, item.productoId, item.cantidad, item.costo, subtotal]
      );

      // Actualizar stock (incrementar)
      await client.query(
        'UPDATE producto SET stock_actual = stock_actual + $1 WHERE id = $2',
        [item.cantidad, item.productoId]
      );

      console.log(`✅ Producto ID ${item.productoId}: Stock +${item.cantidad}, Costo: ${item.costo}`);
    }

    await client.query('COMMIT');

    console.log('✅ Compra creada en BD:', compraResult.rows[0]);

    res.json({
      id: compraId,
      proveedorId,
      proveedor: proveedorCheck.rows[0].nombre,
      productos: productosCompra,
      total,
      fecha: compraResult.rows[0].fecha
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear compra:', error);
    res.status(400).json({ error: error.message || 'Error al crear compra' });
  } finally {
    client.release();
  }
});

// Debug endpoint to show current proveedores
app.get('/api/proveedores/debug', (req, res) => {
  console.log('Current proveedores in backend:', proveedores);
  res.json({ proveedores, count: proveedores.length });
});

// DELETE individual para compras
app.delete('/api/compras/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Eliminar items de compra primero
    await client.query('DELETE FROM item_compra WHERE compra_id = $1', [id]);

    // Eliminar compra
    const result = await client.query('DELETE FROM compra WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    await client.query('COMMIT');

    console.log('✅ Compra eliminada de BD:', result.rows[0]);
    res.json({ mensaje: 'Compra eliminada con éxito' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar compra:', error);
    res.status(500).json({ error: 'Error al eliminar compra' });
  } finally {
    client.release();
  }
});

// DELETE individual para ventas
app.delete('/api/ventas/:id', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const id = parseInt(req.params.id);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Eliminar items de venta primero
    await client.query('DELETE FROM item_venta WHERE id_venta = $1', [id]);

    // Eliminar venta
    const result = await client.query('DELETE FROM venta WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    await client.query('COMMIT');

    console.log('✅ Venta eliminada de BD:', result.rows[0]);
    res.json({ mensaje: 'Venta eliminada con éxito' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error al eliminar venta' });
  } finally {
    client.release();
  }
});

// Bulk delete endpoints
app.delete('/api/productos/bulk', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs válido' });
  }

  const idsNumericos = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

  console.log('Bulk deleting productos with IDs:', idsNumericos);

  try {
    const result = await pool.query('DELETE FROM producto WHERE id = ANY($1) RETURNING id', [idsNumericos]);
    const deletedCount = result.rows.length;

    console.log(`Deleted ${deletedCount} productos`);
    res.json({ message: `${deletedCount} productos eliminados exitosamente`, deletedCount });
  } catch (error) {
    console.error('Error al eliminar productos en bulk:', error);
    if (error.code === '23503') {
      res.status(400).json({ error: 'Algunos productos no se pueden eliminar porque están siendo usados' });
    } else {
      res.status(500).json({ error: 'Error al eliminar productos' });
    }
  }
});

app.delete('/api/clientes/bulk', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs válido' });
  }

  const idsNumericos = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

  console.log('Bulk deleting clientes with IDs:', idsNumericos);

  try {
    const result = await pool.query('DELETE FROM cliente WHERE id = ANY($1) RETURNING id', [idsNumericos]);
    const deletedCount = result.rows.length;

    res.json({ message: `${deletedCount} clientes eliminados exitosamente`, deletedCount });
  } catch (error) {
    console.error('Error al eliminar clientes en bulk:', error);
    if (error.code === '23503') {
      res.status(400).json({ error: 'Algunos clientes no se pueden eliminar porque tienen ventas asociadas' });
    } else {
      res.status(500).json({ error: 'Error al eliminar clientes' });
    }
  }
});

app.delete('/api/proveedores/bulk', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs válido' });
  }

  const idsNumericos = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

  console.log('Bulk deleting proveedores with IDs:', idsNumericos);

  try {
    const result = await pool.query('DELETE FROM proveedor WHERE id = ANY($1) RETURNING id', [idsNumericos]);
    const deletedCount = result.rows.length;

    res.json({ message: `${deletedCount} proveedores eliminados exitosamente`, deletedCount });
  } catch (error) {
    console.error('Error al eliminar proveedores en bulk:', error);
    if (error.code === '23503') {
      res.status(400).json({ error: 'Algunos proveedores no se pueden eliminar porque tienen productos o compras asociadas' });
    } else {
      res.status(500).json({ error: 'Error al eliminar proveedores' });
    }
  }
});

app.delete('/api/compras/bulk', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs válido' });
  }

  console.log('Bulk deleting compras with IDs:', ids);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Eliminar items de compra primero (foreign key)
    await client.query('DELETE FROM item_compra WHERE compra_id = ANY($1)', [ids]);

    // Eliminar compras
    const result = await client.query('DELETE FROM compra WHERE id = ANY($1) RETURNING id', [ids]);
    const deletedCount = result.rows.length;

    await client.query('COMMIT');

    console.log(`Deleted ${deletedCount} compras`);
    res.json({ message: `${deletedCount} compras eliminadas exitosamente`, deletedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar compras en bulk:', error);
    res.status(500).json({ error: 'Error al eliminar compras' });
  } finally {
    client.release();
  }
});

app.delete('/api/ventas/bulk', authenticateToken, authorize(['Administrador']), async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de IDs válido' });
  }

  console.log('Bulk deleting ventas with IDs:', ids);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Eliminar items de venta primero (foreign key)
    await client.query('DELETE FROM item_venta WHERE id_venta = ANY($1)', [ids]);

    // Eliminar ventas
    const result = await client.query('DELETE FROM venta WHERE id = ANY($1) RETURNING id', [ids]);
    const deletedCount = result.rows.length;

    await client.query('COMMIT');

    console.log(`Deleted ${deletedCount} ventas`);
    res.json({ message: `${deletedCount} ventas eliminadas exitosamente`, deletedCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar ventas en bulk:', error);
    res.status(500).json({ error: 'Error al eliminar ventas' });
  } finally {
    client.release();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   🔐 Auth:`);
  console.log(`     POST /api/auth/login`);
  console.log(`     GET  /api/auth/me`);
  console.log(`   📦 Productos (requiere auth):`);
  console.log(`     GET  /api/productos`);
  console.log(`     POST /api/productos (Admin)`);
  console.log(`     PUT  /api/productos/:id (Admin)`);
  console.log(`     DELETE /api/productos/:id (Admin)`);
  console.log(`   📂 Categorías (requiere auth):`);
  console.log(`     GET  /api/categorias`);
  console.log(`   👥 Clientes (requiere auth):`);
  console.log(`     GET  /api/clientes`);
  console.log(`     POST /api/clientes (Admin/Vendedor)`);
  console.log(`   🏪 Proveedores (requiere auth):`);
  console.log(`     GET  /api/proveedores`);
  console.log(`     POST /api/proveedores (Admin)`);
  console.log(`     PUT  /api/proveedores/:id (Admin)`);
  console.log(`     DELETE /api/proveedores/:id (Admin)`);
  console.log(`   🛒 Ventas (requiere auth):`);
  console.log(`     GET  /api/ventas`);
  console.log(`     POST /api/ventas (Admin/Vendedor)`);
  console.log(`     POST /api/comprobantes/:ventaId (Admin/Vendedor)`);
  console.log(`   🛍️ Compras (requiere auth):`);
  console.log(`     GET  /api/compras`);
  console.log(`     POST /api/compras (Admin/Vendedor)`);
  console.log(`   ⚡ Health:`);
  console.log(`     GET  /api/health`);
  console.log(`\n🔑 Usuarios por defecto:`);
  console.log(`   admin@ferreteria.com / admin123 (Administrador)`);
  console.log(`   vendedor@ferreteria.com / vendedor123 (Vendedor)`);
});
