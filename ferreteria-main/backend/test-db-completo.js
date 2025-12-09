/**
 * Script de Pruebas Exhaustivas de Conexión PostgreSQL
 *
 * Este script verifica:
 * - Conexión básica
 * - Operaciones de lectura (SELECT)
 * - Operaciones de escritura (INSERT, UPDATE, DELETE)
 * - Consultas con JOINs
 * - Transacciones
 * - Pool de conexiones múltiples
 */

const pool = require('./config/database');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

/**
 * Función auxiliar para imprimir resultados de pruebas
 */
const printTest = (testName, success, message = '') => {
  if (success) {
    console.log(`${colors.green}✅ PASS${colors.reset} - ${testName}`);
    if (message) console.log(`   ${colors.cyan}${message}${colors.reset}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset} - ${testName}`);
    if (message) console.log(`   ${colors.red}${message}${colors.reset}`);
    testsFailed++;
  }
};

const printSection = (title) => {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
};

/**
 * TEST 1: Conexión Básica
 */
const testBasicConnection = async () => {
  printSection('TEST 1: CONEXIÓN BÁSICA');

  try {
    const client = await pool.connect();
    printTest('Conexión al pool', true, 'Cliente obtenido del pool correctamente');

    const result = await client.query('SELECT NOW(), current_database(), current_user');
    const data = result.rows[0];

    printTest('Consulta SELECT NOW()', true, `Hora: ${data.now}`);
    printTest('Base de datos activa', true, `DB: ${data.current_database}`);
    printTest('Usuario activo', true, `Usuario: ${data.current_user}`);

    client.release();
    printTest('Liberación de cliente', true, 'Cliente devuelto al pool');

  } catch (error) {
    printTest('Conexión básica', false, error.message);
  }
};

/**
 * TEST 2: Lectura de Datos de Todas las Tablas
 */
const testReadOperations = async () => {
  printSection('TEST 2: OPERACIONES DE LECTURA');

  const tables = ['usuario', 'roles', 'categoria', 'producto', 'cliente',
                  'proveedor', 'venta', 'item_venta', 'compra', 'item_compra'];

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
      const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      printTest(
        `Lectura de tabla: ${table}`,
        true,
        `${count.rows[0].count} registros - Columnas: ${result.fields.length}`
      );
    } catch (error) {
      printTest(`Lectura de tabla: ${table}`, false, error.message);
    }
  }
};

/**
 * TEST 3: Estructura de Tablas
 */
const testTableStructure = async () => {
  printSection('TEST 3: ESTRUCTURA DE TABLAS');

  try {
    // Verificar estructura de tabla usuario
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuario'
      ORDER BY ordinal_position
    `);

    printTest(
      'Estructura de tabla usuario',
      userColumns.rows.length > 0,
      `${userColumns.rows.length} columnas encontradas`
    );

    // Verificar llaves primarias
    const primaryKeys = await pool.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    printTest(
      'Llaves primarias',
      primaryKeys.rows.length > 0,
      `${primaryKeys.rows.length} llaves primarias encontradas`
    );

    // Verificar llaves foráneas
    const foreignKeys = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);

    printTest(
      'Llaves foráneas',
      foreignKeys.rows.length >= 0,
      `${foreignKeys.rows.length} relaciones encontradas`
    );

  } catch (error) {
    printTest('Estructura de tablas', false, error.message);
  }
};

/**
 * TEST 4: Consultas con JOINs
 */
const testJoinQueries = async () => {
  printSection('TEST 4: CONSULTAS CON JOINS');

  try {
    // JOIN: Usuario con Roles
    const userRoles = await pool.query(`
      SELECT u.email, r.nombre as rol
      FROM usuario u
      LEFT JOIN roles r ON u.rol_id = r.id
      LIMIT 5
    `);
    printTest(
      'JOIN: Usuario + Roles',
      userRoles.rows.length >= 0,
      `${userRoles.rows.length} registros obtenidos`
    );

    // JOIN: Producto con Categoría
    const productCategory = await pool.query(`
      SELECT p.nombre as producto, c.nombre as categoria
      FROM producto p
      LEFT JOIN categoria c ON p.categoria_id = c.id
      LIMIT 5
    `);
    printTest(
      'JOIN: Producto + Categoría',
      productCategory.rows.length >= 0,
      `${productCategory.rows.length} registros obtenidos`
    );

    // JOIN Complejo: Venta + Cliente + Items
    const ventasCompletas = await pool.query(`
      SELECT
        v.id as venta_id,
        c.nombre as cliente,
        v.total,
        COUNT(iv.id) as items_count
      FROM venta v
      LEFT JOIN cliente c ON v.cliente_id = c.id
      LEFT JOIN item_venta iv ON iv.venta_id = v.id
      GROUP BY v.id, c.nombre, v.total
      LIMIT 5
    `);
    printTest(
      'JOIN Complejo: Venta + Cliente + Items',
      ventasCompletas.rows.length >= 0,
      `${ventasCompletas.rows.length} ventas con detalles`
    );

  } catch (error) {
    printTest('Consultas con JOINs', false, error.message);
  }
};

/**
 * TEST 5: Operaciones de Escritura (con ROLLBACK)
 */
const testWriteOperations = async () => {
  printSection('TEST 5: OPERACIONES DE ESCRITURA (TRANSACCIONES)');

  const client = await pool.connect();

  try {
    // Iniciar transacción
    await client.query('BEGIN');
    printTest('Inicio de transacción', true, 'BEGIN ejecutado');

    // INSERT
    const insertResult = await client.query(`
      INSERT INTO categoria (nombre, descripcion)
      VALUES ('TEST_CATEGORIA', 'Categoría de prueba')
      RETURNING id, nombre
    `);
    printTest(
      'INSERT en categoría',
      insertResult.rows.length === 1,
      `ID insertado: ${insertResult.rows[0].id}`
    );
    const testCategoryId = insertResult.rows[0].id;

    // UPDATE
    const updateResult = await client.query(`
      UPDATE categoria
      SET descripcion = 'Descripción actualizada'
      WHERE id = $1
      RETURNING *
    `, [testCategoryId]);
    printTest(
      'UPDATE en categoría',
      updateResult.rowCount === 1,
      'Registro actualizado correctamente'
    );

    // SELECT para verificar
    const selectResult = await client.query(`
      SELECT * FROM categoria WHERE id = $1
    `, [testCategoryId]);
    printTest(
      'SELECT después de UPDATE',
      selectResult.rows[0].descripcion === 'Descripción actualizada',
      'Datos actualizados verificados'
    );

    // DELETE
    const deleteResult = await client.query(`
      DELETE FROM categoria WHERE id = $1
    `, [testCategoryId]);
    printTest(
      'DELETE en categoría',
      deleteResult.rowCount === 1,
      'Registro eliminado correctamente'
    );

    // ROLLBACK para no afectar la BD real
    await client.query('ROLLBACK');
    printTest('ROLLBACK de transacción', true, 'Cambios revertidos - BD sin modificar');

  } catch (error) {
    await client.query('ROLLBACK');
    printTest('Operaciones de escritura', false, error.message);
  } finally {
    client.release();
  }
};

/**
 * TEST 6: Consultas Parametrizadas (Prevención SQL Injection)
 */
const testParameterizedQueries = async () => {
  printSection('TEST 6: CONSULTAS PARAMETRIZADAS');

  try {
    // Consulta parametrizada segura
    const email = 'admin@ferreteria.com';
    const result = await pool.query(
      'SELECT email, nombre FROM usuario WHERE email = $1',
      [email]
    );
    printTest(
      'Consulta parametrizada',
      true,
      `Usuario encontrado: ${result.rows.length > 0 ? result.rows[0].email : 'ninguno'}`
    );

    // Múltiples parámetros
    const multiParam = await pool.query(
      'SELECT * FROM producto WHERE stock >= $1 AND precio <= $2 LIMIT $3',
      [0, 999999, 5]
    );
    printTest(
      'Consulta con múltiples parámetros',
      true,
      `${multiParam.rows.length} productos encontrados`
    );

  } catch (error) {
    printTest('Consultas parametrizadas', false, error.message);
  }
};

/**
 * TEST 7: Pool de Conexiones Múltiples
 */
const testConnectionPool = async () => {
  printSection('TEST 7: POOL DE CONEXIONES MÚLTIPLES');

  try {
    // Ejecutar múltiples consultas en paralelo
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        pool.query('SELECT $1 as query_number, NOW() as timestamp', [i])
      );
    }

    const results = await Promise.all(promises);
    printTest(
      'Consultas paralelas',
      results.length === 5,
      `${results.length} consultas ejecutadas simultáneamente`
    );

    // Verificar estado del pool
    printTest(
      'Pool - Total conexiones',
      true,
      `Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`
    );

  } catch (error) {
    printTest('Pool de conexiones', false, error.message);
  }
};

/**
 * TEST 8: Manejo de Errores
 */
const testErrorHandling = async () => {
  printSection('TEST 8: MANEJO DE ERRORES');

  try {
    // Intentar consulta en tabla inexistente
    await pool.query('SELECT * FROM tabla_que_no_existe');
    printTest('Error de tabla inexistente', false, 'Debería haber lanzado error');
  } catch (error) {
    printTest(
      'Error de tabla inexistente capturado',
      error.code === '42P01',
      `Código de error: ${error.code}`
    );
  }

  try {
    // Intentar columna inexistente
    await pool.query('SELECT columna_inexistente FROM usuario');
    printTest('Error de columna inexistente', false, 'Debería haber lanzado error');
  } catch (error) {
    printTest(
      'Error de columna inexistente capturado',
      error.code === '42703',
      `Código de error: ${error.code}`
    );
  }
};

/**
 * TEST 9: Funciones de Agregación
 */
const testAggregationFunctions = async () => {
  printSection('TEST 9: FUNCIONES DE AGREGACIÓN');

  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_productos,
        AVG(precio) as precio_promedio,
        MAX(precio) as precio_maximo,
        MIN(precio) as precio_minimo,
        SUM(stock) as stock_total
      FROM producto
    `);

    const data = stats.rows[0];
    printTest('COUNT - Total productos', true, `${data.total_productos} productos`);
    printTest('AVG - Precio promedio', true, `$${parseFloat(data.precio_promedio).toFixed(2)}`);
    printTest('MAX - Precio máximo', true, `$${data.precio_maximo}`);
    printTest('MIN - Precio mínimo', true, `$${data.precio_minimo}`);
    printTest('SUM - Stock total', true, `${data.stock_total} unidades`);

  } catch (error) {
    printTest('Funciones de agregación', false, error.message);
  }
};

/**
 * Función Principal
 */
const runAllTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  🧪 SUITE DE PRUEBAS EXHAUSTIVAS - BASE DE DATOS         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  Sistema de Ventas - PostgreSQL                           ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const startTime = Date.now();

  try {
    await testBasicConnection();
    await testReadOperations();
    await testTableStructure();
    await testJoinQueries();
    await testWriteOperations();
    await testParameterizedQueries();
    await testConnectionPool();
    await testErrorHandling();
    await testAggregationFunctions();

  } catch (error) {
    console.error(`\n${colors.red}Error fatal durante las pruebas:${colors.reset}`, error);
  }

  // Cerrar pool
  await pool.end();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Resumen Final
  printSection('RESUMEN DE PRUEBAS');
  console.log(`${colors.green}✅ Pruebas exitosas: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Pruebas fallidas: ${testsFailed}${colors.reset}`);
  console.log(`${colors.yellow}📊 Total de pruebas: ${testsPassed + testsFailed}${colors.reset}`);
  console.log(`${colors.cyan}⏱️  Tiempo de ejecución: ${duration}s${colors.reset}`);

  const successRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2);
  console.log(`\n${colors.bright}Tasa de éxito: ${successRate}%${colors.reset}\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! 🎉${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Algunas pruebas fallaron. Revisa los errores arriba.${colors.reset}\n`);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
};

// Ejecutar todas las pruebas
runAllTests();
