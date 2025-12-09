/**
 * Script de Prueba de Inserción de Datos
 * Este script simula las operaciones que hace el frontend
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
let authToken = '';

// Colores para la consola
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (msg, color = c.reset) => console.log(`${color}${msg}${c.reset}`);

/**
 * Paso 1: Login
 */
const login = async () => {
  try {
    log('\n1️⃣  Intentando login...', c.blue);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ferreteria.com',
      password: 'admin123'
    });

    authToken = response.data.token;
    log(`✅ Login exitoso - Token obtenido`, c.green);
    log(`   Usuario: ${response.data.usuario.nombre} (${response.data.usuario.rol.nombre})`, c.cyan);
    return true;
  } catch (error) {
    log(`❌ Error en login: ${error.response?.data?.error || error.message}`, c.red);
    return false;
  }
};

/**
 * Paso 2: Obtener categorías
 */
const obtenerCategorias = async () => {
  try {
    log('\n2️⃣  Obteniendo categorías...', c.blue);
    const response = await axios.get(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Categorías obtenidas: ${response.data.length}`, c.green);
    response.data.forEach(cat => {
      log(`   • ${cat.nombre} (ID: ${cat.id})`, c.cyan);
    });
    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.error || error.message}`, c.red);
    return [];
  }
};

/**
 * Paso 3: Obtener proveedores
 */
const obtenerProveedores = async () => {
  try {
    log('\n3️⃣  Obteniendo proveedores...', c.blue);
    const response = await axios.get(`${API_URL}/proveedores`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Proveedores obtenidos: ${response.data.length}`, c.green);
    response.data.forEach(prov => {
      log(`   • ${prov.nombre} (ID: ${prov.id})`, c.cyan);
    });
    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.error || error.message}`, c.red);
    return [];
  }
};

/**
 * Paso 4: Crear un nuevo producto
 */
const crearProducto = async (categoriaId, proveedorId) => {
  try {
    log('\n4️⃣  Creando nuevo producto...', c.blue);

    const nuevoProducto = {
      nombre: `Producto de Prueba ${Date.now()}`,
      precio: 50000,
      costo: 30000,
      stock_inicial: 10,
      categoria_id: categoriaId,
      proveedor_id: proveedorId
    };

    log(`   Datos del producto:`, c.cyan);
    log(`   - Nombre: ${nuevoProducto.nombre}`, c.cyan);
    log(`   - Precio: ${nuevoProducto.precio}`, c.cyan);
    log(`   - Stock: ${nuevoProducto.stock_inicial}`, c.cyan);
    log(`   - Categoría ID: ${nuevoProducto.categoria_id}`, c.cyan);
    log(`   - Proveedor ID: ${nuevoProducto.proveedor_id}`, c.cyan);

    const response = await axios.post(`${API_URL}/productos`, nuevoProducto, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Producto creado exitosamente!`, c.green);
    log(`   ID: ${response.data.id}`, c.green);
    log(`   Código: ${response.data.codigo}`, c.green);
    log(`   Nombre: ${response.data.nombre}`, c.green);
    return response.data;
  } catch (error) {
    log(`❌ Error al crear producto: ${error.response?.data?.error || error.message}`, c.red);
    if (error.response?.data) {
      log(`   Detalles: ${JSON.stringify(error.response.data)}`, c.red);
    }
    return null;
  }
};

/**
 * Paso 5: Verificar que el producto existe en la BD
 */
const verificarProducto = async (productoId) => {
  try {
    log('\n5️⃣  Verificando producto en la base de datos...', c.blue);
    const response = await axios.get(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const producto = response.data.find(p => p.id === productoId);
    if (producto) {
      log(`✅ Producto encontrado en la base de datos!`, c.green);
      log(`   ID: ${producto.id}`, c.cyan);
      log(`   Código: ${producto.codigo}`, c.cyan);
      log(`   Nombre: ${producto.nombre}`, c.cyan);
      log(`   Stock: ${producto.stock}`, c.cyan);
      return true;
    } else {
      log(`❌ Producto NO encontrado en la base de datos`, c.red);
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.response?.data?.error || error.message}`, c.red);
    return false;
  }
};

/**
 * Paso 6: Crear un cliente
 */
const crearCliente = async () => {
  try {
    log('\n6️⃣  Creando nuevo cliente...', c.blue);

    const nuevoCliente = {
      nombre: `Cliente Prueba ${Date.now()}`,
      cedula: `${Math.floor(Math.random() * 10000000)}`,
      email: `cliente${Date.now()}@test.com`,
      telefono: '0981-123456',
      direccion: 'Dirección de prueba'
    };

    const response = await axios.post(`${API_URL}/clientes`, nuevoCliente, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Cliente creado exitosamente!`, c.green);
    log(`   ID: ${response.data.id}`, c.green);
    log(`   Nombre: ${response.data.nombre}`, c.green);
    log(`   Cédula: ${response.data.cedula}`, c.green);
    return response.data;
  } catch (error) {
    log(`❌ Error al crear cliente: ${error.response?.data?.error || error.message}`, c.red);
    return null;
  }
};

/**
 * Función principal
 */
const runTests = async () => {
  log('\n╔════════════════════════════════════════════════════════════╗', c.yellow);
  log('║  🧪 PRUEBA DE INSERCIÓN DE DATOS - BACKEND + POSTGRESQL   ║', c.yellow);
  log('╚════════════════════════════════════════════════════════════╝', c.yellow);

  // 1. Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ No se pudo continuar sin autenticación', c.red);
    process.exit(1);
  }

  // 2. Obtener categorías
  const categorias = await obtenerCategorias();
  if (categorias.length === 0) {
    log('\n⚠️  No hay categorías disponibles', c.yellow);
    return;
  }

  // 3. Obtener proveedores
  const proveedores = await obtenerProveedores();
  const proveedorId = proveedores.length > 0 ? proveedores[0].id : null;

  // 4. Crear producto
  const producto = await crearProducto(categorias[0].id, proveedorId);
  if (!producto) {
    log('\n❌ No se pudo crear el producto', c.red);
    process.exit(1);
  }

  // 5. Verificar producto
  const verificado = await verificarProducto(producto.id);

  // 6. Crear cliente
  await crearCliente();

  // Resumen
  log('\n' + '='.repeat(60), c.yellow);
  log('📊 RESUMEN DE PRUEBAS', c.yellow);
  log('='.repeat(60), c.yellow);
  log(`✅ Login: Exitoso`, c.green);
  log(`✅ Categorías: ${categorias.length} obtenidas`, c.green);
  log(`✅ Proveedores: ${proveedores.length} obtenidos`, c.green);
  log(`${verificado ? '✅' : '❌'} Producto: ${verificado ? 'Creado y verificado' : 'Error'}`, verificado ? c.green : c.red);
  log('');

  if (verificado) {
    log('🎉 TODAS LAS PRUEBAS PASARON - LOS DATOS SE GUARDAN EN POSTGRESQL 🎉', c.green);
  } else {
    log('⚠️  ALGUNAS PRUEBAS FALLARON', c.yellow);
  }

  log('');
  process.exit(0);
};

// Ejecutar pruebas
runTests();
