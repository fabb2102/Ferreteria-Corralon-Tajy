/**
 * Script para probar que los endpoints GET devuelven datos correctamente
 * para popular los combobox del frontend
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
let authToken = '';

const log = (msg, color = '\x1b[0m') => console.log(`${color}${msg}\x1b[0m`);

const login = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@ferreteria.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    log('✅ Login exitoso', '\x1b[32m');
    return true;
  } catch (error) {
    log(`❌ Error en login: ${error.message}`, '\x1b[31m');
    return false;
  }
};

const testProductos = async () => {
  try {
    log('\n📦 PROBANDO GET /api/productos', '\x1b[34m');
    const response = await axios.get(`${API_URL}/productos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Respuesta recibida - ${response.data.length} productos`, '\x1b[32m');

    if (response.data.length > 0) {
      log('\n📋 Primeros 3 productos:', '\x1b[36m');
      response.data.slice(0, 3).forEach((p, i) => {
        console.log(`\n${i + 1}. Producto:`);
        console.log(`   id: ${p.id}`);
        console.log(`   codigo: ${p.codigo}`);
        console.log(`   nombre: ${p.nombre}`);
        console.log(`   precio: ${p.precio}`);
        console.log(`   stock: ${p.stock}`);
        console.log(`   categoria: ${p.categoria}`);
        console.log(`   categoria_id: ${p.categoria_id}`);
        console.log(`   proveedor: ${p.proveedor}`);
        console.log(`   proveedor_id: ${p.proveedor_id}`);
        console.log(`   activo: ${p.activo}`);
      });
    } else {
      log('⚠️  No hay productos en la base de datos', '\x1b[33m');
    }

    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, '\x1b[31m');
    if (error.response) {
      log(`   Status: ${error.response.status}`, '\x1b[31m');
      log(`   Data: ${JSON.stringify(error.response.data)}`, '\x1b[31m');
    }
    return [];
  }
};

const testProveedores = async () => {
  try {
    log('\n🏪 PROBANDO GET /api/proveedores', '\x1b[34m');
    const response = await axios.get(`${API_URL}/proveedores`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Respuesta recibida - ${response.data.length} proveedores`, '\x1b[32m');

    if (response.data.length > 0) {
      log('\n📋 Todos los proveedores:', '\x1b[36m');
      response.data.forEach((p, i) => {
        console.log(`\n${i + 1}. Proveedor:`);
        console.log(`   id: ${p.id}`);
        console.log(`   nombre: ${p.nombre}`);
        console.log(`   ruc: ${p.ruc || 'N/A'}`);
        console.log(`   telefono: ${p.telefono || 'N/A'}`);
        console.log(`   direccion: ${p.direccion || 'N/A'}`);
      });
    } else {
      log('⚠️  No hay proveedores en la base de datos', '\x1b[33m');
    }

    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, '\x1b[31m');
    if (error.response) {
      log(`   Status: ${error.response.status}`, '\x1b[31m');
      log(`   Data: ${JSON.stringify(error.response.data)}`, '\x1b[31m');
    }
    return [];
  }
};

const testCategorias = async () => {
  try {
    log('\n📂 PROBANDO GET /api/categorias', '\x1b[34m');
    const response = await axios.get(`${API_URL}/categorias`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Respuesta recibida - ${response.data.length} categorías`, '\x1b[32m');

    if (response.data.length > 0) {
      log('\n📋 Todas las categorías:', '\x1b[36m');
      response.data.forEach((c, i) => {
        console.log(`${i + 1}. id: ${c.id}, nombre: ${c.nombre}`);
      });
    }

    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, '\x1b[31m');
    return [];
  }
};

const testClientes = async () => {
  try {
    log('\n👥 PROBANDO GET /api/clientes', '\x1b[34m');
    const response = await axios.get(`${API_URL}/clientes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    log(`✅ Respuesta recibida - ${response.data.length} clientes`, '\x1b[32m');

    if (response.data.length > 0) {
      log('\n📋 Primeros 3 clientes:', '\x1b[36m');
      response.data.slice(0, 3).forEach((c, i) => {
        console.log(`${i + 1}. id: ${c.id}, nombre: ${c.nombre}, cedula: ${c.cedula}`);
      });
    }

    return response.data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, '\x1b[31m');
    return [];
  }
};

const runTests = async () => {
  log('\n╔════════════════════════════════════════════════════════════╗', '\x1b[35m');
  log('║  🧪 PRUEBA DE COMBOBOX - ENDPOINTS GET                     ║', '\x1b[35m');
  log('╚════════════════════════════════════════════════════════════╝', '\x1b[35m');

  const loginOk = await login();
  if (!loginOk) {
    log('\n❌ No se pudo continuar sin autenticación', '\x1b[31m');
    process.exit(1);
  }

  const productos = await testProductos();
  const proveedores = await testProveedores();
  const categorias = await testCategorias();
  const clientes = await testClientes();

  log('\n' + '='.repeat(60), '\x1b[33m');
  log('📊 RESUMEN', '\x1b[33m');
  log('='.repeat(60), '\x1b[33m');
  log(`Productos: ${productos.length}`, productos.length > 0 ? '\x1b[32m' : '\x1b[31m');
  log(`Proveedores: ${proveedores.length}`, proveedores.length > 0 ? '\x1b[32m' : '\x1b[31m');
  log(`Categorías: ${categorias.length}`, categorias.length > 0 ? '\x1b[32m' : '\x1b[31m');
  log(`Clientes: ${clientes.length}`, clientes.length > 0 ? '\x1b[32m' : '\x1b[31m');

  log('\n💡 DIAGNÓSTICO:', '\x1b[36m');

  if (productos.length === 0) {
    log('⚠️  Combobox de productos estará vacío - No hay productos en la BD', '\x1b[33m');
  } else if (!productos[0].hasOwnProperty('id') || !productos[0].hasOwnProperty('nombre')) {
    log('⚠️  Los productos no tienen el formato correcto (falta id o nombre)', '\x1b[33m');
  } else {
    log('✅ Productos tienen formato correcto para combobox', '\x1b[32m');
  }

  if (proveedores.length === 0) {
    log('⚠️  Combobox de proveedores estará vacío - No hay proveedores en la BD', '\x1b[33m');
  } else if (!proveedores[0].hasOwnProperty('id') || !proveedores[0].hasOwnProperty('nombre')) {
    log('⚠️  Los proveedores no tienen el formato correcto (falta id o nombre)', '\x1b[33m');
  } else {
    log('✅ Proveedores tienen formato correcto para combobox', '\x1b[32m');
  }

  log('');
  process.exit(0);
};

runTests();
