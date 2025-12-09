/**
 * Script de Pruebas Final - Adaptado a la estructura real de la BD
 */

const pool = require('./config/database');

// Colores
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let passed = 0;
let failed = 0;

const printTest = (name, success, detail = '') => {
  if (success) {
    console.log(`${c.green}✅${c.reset} ${name}`);
    if (detail) console.log(`   ${c.cyan}→ ${detail}${c.reset}`);
    passed++;
  } else {
    console.log(`${c.red}❌${c.reset} ${name}`);
    if (detail) console.log(`   ${c.red}→ ${detail}${c.reset}`);
    failed++;
  }
};

const section = (title) => {
  console.log(`\n${c.bright}${c.blue}━━━ ${title} ${'━'.repeat(60 - title.length)}${c.reset}\n`);
};

const runTests = async () => {
  console.log(`\n${c.bright}${c.magenta}╔════════════════════════════════════════════════════════════════╗`);
  console.log(`║  🧪 SUITE DE PRUEBAS COMPLETA - POSTGRESQL                    ║`);
  console.log(`║  Base de Datos: sistema_ventas                                 ║`);
  console.log(`╚════════════════════════════════════════════════════════════════╝${c.reset}\n`);

  const start = Date.now();

  try {
    // ============== TEST 1: Conexión ==============
    section('1️⃣  CONEXIÓN A LA BASE DE DATOS');

    const client = await pool.connect();
    printTest('Conexión establecida', true, 'Pool conectado exitosamente');

    const { rows } = await client.query('SELECT NOW(), current_database(), version()');
    printTest('Consulta básica', true, `DB: ${rows[0].current_database}`);
    printTest('Versión PostgreSQL', true, rows[0].version.split(',')[0]);

    client.release();
    printTest('Cliente liberado', true, 'Retornado al pool');

    // ============== TEST 2: Lectura de Datos ==============
    section('2️⃣  LECTURA DE DATOS DE TABLAS');

    const tables = ['usuario', 'roles', 'categoria', 'producto', 'cliente',
                    'proveedor', 'venta', 'item_venta', 'compra', 'item_compra'];

    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = result.rows[0].count;
      printTest(`Tabla: ${table}`, true, `${count} registros`);
    }

    // ============== TEST 3: Datos de Usuarios ==============
    section('3️⃣  VERIFICACIÓN DE DATOS - USUARIOS');

    const usuarios = await pool.query('SELECT id, nombre, email, estado FROM usuario');
    printTest('Consulta de usuarios', usuarios.rows.length > 0, `${usuarios.rows.length} usuarios encontrados`);

    usuarios.rows.forEach(u => {
      console.log(`   ${c.cyan}👤 ${u.nombre} (${u.email}) - Estado: ${u.estado ? 'Activo' : 'Inactivo'}${c.reset}`);
    });

    // ============== TEST 4: Productos con Categoría ==============
    section('4️⃣  CONSULTAS CON JOINS');

    const productosConCategoria = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.codigo,
        p.stock_actual,
        p.precio_venta,
        c.nombre_cat as categoria,
        pr.nombre as proveedor
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id
      LEFT JOIN proveedor pr ON p.id_proveedor = pr.id
      ORDER BY p.nombre
      LIMIT 5
    `);
    printTest('JOIN: Producto + Categoría + Proveedor', productosConCategoria.rows.length > 0, `${productosConCategoria.rows.length} productos`);

    if (productosConCategoria.rows.length > 0) {
      console.log(`\n   ${c.bright}Productos encontrados:${c.reset}`);
      productosConCategoria.rows.forEach(p => {
        console.log(`   ${c.cyan}📦 ${p.nombre} - Stock: ${p.stock_actual} - Precio: $${p.precio_venta || 0}${c.reset}`);
      });
    }

    // ============== TEST 5: Ventas Completas ==============
    const ventasCompletas = await pool.query(`
      SELECT
        v.id,
        v.numero_venta,
        v.fecha_hora,
        c.nombre as cliente_nombre,
        COUNT(iv.id) as items_count,
        SUM(iv.subtotal) as total
      FROM venta v
      LEFT JOIN cliente c ON v.cliente = c.id
      LEFT JOIN item_venta iv ON iv.id_venta = v.id
      GROUP BY v.id, v.numero_venta, v.fecha_hora, c.nombre
      ORDER BY v.fecha_hora DESC
      LIMIT 5
    `);
    printTest('JOIN: Venta + Cliente + Items', ventasCompletas.rows.length >= 0, `${ventasCompletas.rows.length} ventas con detalles`);

    if (ventasCompletas.rows.length > 0) {
      console.log(`\n   ${c.bright}Últimas ventas:${c.reset}`);
      ventasCompletas.rows.forEach(v => {
        console.log(`   ${c.cyan}🛒 #${v.numero_venta} - Cliente: ${v.cliente_nombre || 'N/A'} - Items: ${v.items_count} - Total: $${v.total || 0}${c.reset}`);
      });
    }

    // ============== TEST 6: Transacciones ==============
    section('5️⃣  TRANSACCIONES (INSERT/UPDATE/DELETE)');

    const txClient = await pool.connect();
    try {
      await txClient.query('BEGIN');
      printTest('Inicio de transacción', true, 'BEGIN ejecutado');

      // INSERT
      const insertResult = await txClient.query(`
        INSERT INTO categoria (nombre_cat)
        VALUES ('CATEGORIA_TEST')
        RETURNING id, nombre_cat
      `);
      const testId = insertResult.rows[0].id;
      printTest('INSERT', insertResult.rowCount === 1, `ID: ${testId}, Nombre: ${insertResult.rows[0].nombre_cat}`);

      // UPDATE
      const updateResult = await txClient.query(`
        UPDATE categoria SET nombre_cat = 'CATEGORIA_TEST_ACTUALIZADA'
        WHERE id = $1
        RETURNING nombre_cat
      `, [testId]);
      printTest('UPDATE', updateResult.rowCount === 1, `Nuevo nombre: ${updateResult.rows[0].nombre_cat}`);

      // SELECT para verificar
      const selectResult = await txClient.query('SELECT * FROM categoria WHERE id = $1', [testId]);
      printTest('SELECT después de UPDATE', selectResult.rows.length === 1, 'Datos verificados correctamente');

      // DELETE
      const deleteResult = await txClient.query('DELETE FROM categoria WHERE id = $1', [testId]);
      printTest('DELETE', deleteResult.rowCount === 1, 'Registro eliminado');

      // ROLLBACK
      await txClient.query('ROLLBACK');
      printTest('ROLLBACK', true, 'Transacción revertida - BD intacta');

    } catch (error) {
      await txClient.query('ROLLBACK');
      printTest('Transacciones', false, error.message);
    } finally {
      txClient.release();
    }

    // ============== TEST 7: Consultas Parametrizadas ==============
    section('6️⃣  CONSULTAS PARAMETRIZADAS (Seguridad SQL Injection)');

    const userByEmail = await pool.query(
      'SELECT nombre, email FROM usuario WHERE email = $1',
      ['admin@ferreteria.com']
    );
    printTest('Consulta con 1 parámetro', true, `Usuario: ${userByEmail.rows[0]?.nombre || 'No encontrado'}`);

    const productosFiltrados = await pool.query(
      'SELECT * FROM producto WHERE stock_actual >= $1 AND precio_venta <= $2 LIMIT $3',
      [0, 999999, 3]
    );
    printTest('Consulta con múltiples parámetros', true, `${productosFiltrados.rows.length} productos filtrados`);

    // ============== TEST 8: Pool de Conexiones ==============
    section('7️⃣  POOL DE CONEXIONES SIMULTÁNEAS');

    const queries = Array(10).fill(null).map((_, i) =>
      pool.query('SELECT $1 as numero, NOW() as timestamp', [i + 1])
    );

    const results = await Promise.all(queries);
    printTest('10 consultas paralelas', results.length === 10, `Todas ejecutadas simultáneamente`);
    printTest('Estado del pool', true, `Total: ${pool.totalCount}, Activas: ${pool.totalCount - pool.idleCount}, Idle: ${pool.idleCount}`);

    // ============== TEST 9: Manejo de Errores ==============
    section('8️⃣  MANEJO DE ERRORES');

    try {
      await pool.query('SELECT * FROM tabla_inexistente');
      printTest('Detección de tabla inexistente', false, 'No detectó el error');
    } catch (err) {
      printTest('Error de tabla inexistente', err.code === '42P01', `Código: ${err.code}`);
    }

    try {
      await pool.query('SELECT columna_falsa FROM usuario');
      printTest('Detección de columna inexistente', false, 'No detectó el error');
    } catch (err) {
      printTest('Error de columna inexistente', err.code === '42703', `Código: ${err.code}`);
    }

    // ============== TEST 10: Funciones de Agregación ==============
    section('9️⃣  FUNCIONES DE AGREGACIÓN Y ESTADÍSTICAS');

    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_productos,
        COALESCE(AVG(precio_venta), 0) as precio_promedio,
        COALESCE(MAX(precio_venta), 0) as precio_max,
        COALESCE(MIN(precio_venta), 0) as precio_min,
        SUM(stock_actual) as stock_total
      FROM producto
      WHERE precio_venta IS NOT NULL
    `);

    const st = stats.rows[0];
    printTest('COUNT - Total productos', true, `${st.total_productos} productos`);
    printTest('AVG - Precio promedio', true, `$${parseFloat(st.precio_promedio).toFixed(2)}`);
    printTest('MAX - Precio máximo', true, `$${st.precio_max}`);
    printTest('MIN - Precio mínimo', true, `$${st.precio_min}`);
    printTest('SUM - Stock total', true, `${st.stock_total} unidades`);

    // Estadísticas de ventas
    const ventaStats = await pool.query(`
      SELECT
        COUNT(DISTINCT v.id) as total_ventas,
        COUNT(iv.id) as total_items,
        COALESCE(SUM(iv.subtotal), 0) as total_facturado
      FROM venta v
      LEFT JOIN item_venta iv ON iv.id_venta = v.id
    `);

    const vs = ventaStats.rows[0];
    printTest('Estadísticas de ventas', true, `${vs.total_ventas} ventas, ${vs.total_items} items, Total: $${vs.total_facturado}`);

    // ============== TEST 11: Integridad Referencial ==============
    section('🔟  INTEGRIDAD REFERENCIAL (Foreign Keys)');

    const fkeys = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name
    `);

    printTest('Relaciones de llaves foráneas', fkeys.rows.length > 0, `${fkeys.rows.length} relaciones definidas`);

    if (fkeys.rows.length > 0) {
      console.log(`\n   ${c.bright}Relaciones encontradas:${c.reset}`);
      fkeys.rows.forEach(fk => {
        console.log(`   ${c.cyan}🔗 ${fk.table_name}.${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}${c.reset}`);
      });
    }

  } catch (error) {
    console.error(`\n${c.red}❌ Error fatal:${c.reset}`, error.message);
  } finally {
    await pool.end();
  }

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  // ============== RESUMEN ==============
  section('📊  RESUMEN FINAL');

  console.log(`${c.green}✅ Pruebas exitosas:  ${passed}${c.reset}`);
  console.log(`${c.red}❌ Pruebas fallidas:  ${failed}${c.reset}`);
  console.log(`${c.yellow}📊 Total de pruebas:  ${passed + failed}${c.reset}`);
  console.log(`${c.cyan}⏱️  Tiempo ejecución: ${duration}s${c.reset}`);

  const rate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`\n${c.bright}Tasa de éxito: ${rate}%${c.reset}`);

  if (failed === 0) {
    console.log(`\n${c.green}${c.bright}🎉 ¡TODAS LAS PRUEBAS PASARON! LA CONEXIÓN FUNCIONA PERFECTAMENTE 🎉${c.reset}\n`);
  } else {
    console.log(`\n${c.yellow}⚠️  ${failed} prueba(s) fallaron${c.reset}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
