/**
 * Script de Prueba de Conexión PostgreSQL
 *
 * Este script verifica la conexión a la base de datos y muestra:
 * - Conexión exitosa
 * - Hora actual del servidor
 * - Lista de todas las tablas en la base de datos
 */

const pool = require('./config/database');

/**
 * Función principal para probar la conexión
 */
const testDatabaseConnection = async () => {
  console.log('\n🔍 INICIANDO PRUEBA DE CONEXIÓN A POSTGRESQL');
  console.log('='.repeat(50));

  try {
    // 1. Obtener un cliente del pool
    const client = await pool.connect();
    console.log('✅ Conexión establecida correctamente\n');

    // 2. Ejecutar consulta simple para obtener la hora del servidor
    console.log('📅 Consultando hora del servidor...');
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log(`   ⏰ Hora del servidor: ${timeResult.rows[0].current_time}\n`);

    // 3. Obtener información de la base de datos
    const dbInfoResult = await client.query(`
      SELECT current_database() as db_name,
             current_user as user_name,
             version() as pg_version
    `);
    const dbInfo = dbInfoResult.rows[0];
    console.log('📊 Información de la base de datos:');
    console.log(`   📁 Base de datos: ${dbInfo.db_name}`);
    console.log(`   👤 Usuario: ${dbInfo.user_name}`);
    console.log(`   🔧 Versión PostgreSQL: ${dbInfo.pg_version.split(',')[0]}\n`);

    // 4. Listar todas las tablas de la base de datos
    console.log('📋 Listando todas las tablas en la base de datos...');
    const tablesResult = await client.query(`
      SELECT
        table_name,
        table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length > 0) {
      console.log(`   ✅ Encontradas ${tablesResult.rows.length} tabla(s):\n`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name} (schema: ${row.table_schema})`);
      });
    } else {
      console.log('   ⚠️  No se encontraron tablas en el esquema public');
    }

    // 5. Obtener conteo de registros en cada tabla (opcional)
    console.log('\n📊 Conteo de registros por tabla:');
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`   📦 ${table.table_name}: ${countResult.rows[0].count} registro(s)`);
      } catch (error) {
        console.log(`   ⚠️  ${table.table_name}: No se pudo contar (${error.message})`);
      }
    }

    // 6. Liberar el cliente de vuelta al pool
    client.release();
    console.log('\n✅ Cliente liberado de vuelta al pool');

    // 7. Cerrar el pool
    await pool.end();
    console.log('✅ Pool de conexiones cerrado correctamente');

    console.log('\n' + '='.repeat(50));
    console.log('✅ PRUEBA DE CONEXIÓN COMPLETADA EXITOSAMENTE\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA DE CONEXIÓN:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Sugerencia: Verifica que PostgreSQL esté ejecutándose');
    } else if (error.code === '3D000') {
      console.error('\n💡 Sugerencia: La base de datos especificada no existe');
    } else if (error.code === '28P01') {
      console.error('\n💡 Sugerencia: Usuario o contraseña incorrectos');
    }

    console.error('\n' + '='.repeat(50));
    process.exit(1);
  }
};

// Ejecutar la prueba
testDatabaseConnection();
