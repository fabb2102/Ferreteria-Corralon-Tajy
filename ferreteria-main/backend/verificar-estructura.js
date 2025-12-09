/**
 * Script para verificar la estructura de todas las tablas
 */

const pool = require('./config/database');

const verificarEstructura = async () => {
  console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLAS\n');
  console.log('='.repeat(70));

  try {
    // Obtener todas las tablas
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;

      // Obtener columnas de cada tabla
      const columnsResult = await pool.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`\n📋 Tabla: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(70));

      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? `DEFAULT: ${col.column_default}` : '';

        console.log(`  • ${col.column_name.padEnd(25)} ${col.data_type}${maxLength.padEnd(10)} ${nullable.padEnd(10)} ${defaultVal}`);
      });
    }

    await pool.end();
    console.log('\n' + '='.repeat(70));
    console.log('✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verificarEstructura();
