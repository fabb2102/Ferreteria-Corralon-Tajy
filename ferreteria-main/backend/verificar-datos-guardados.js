/**
 * Verificar que los datos insertados están realmente en PostgreSQL
 */

const pool = require('./config/database');

const verificarDatos = async () => {
  console.log('\n🔍 VERIFICANDO DATOS EN POSTGRESQL\n');
  console.log('='.repeat(60));

  try {
    // Verificar productos recientes
    console.log('\n📦 PRODUCTOS RECIENTES:');
    const productos = await pool.query(`
      SELECT
        p.id,
        p.codigo,
        p.nombre,
        p.precio_venta,
        p.stock_actual,
        c.nombre_cat as categoria,
        pr.nombre as proveedor
      FROM producto p
      LEFT JOIN categoria c ON p.id_categoria = c.id
      LEFT JOIN proveedor pr ON p.id_proveedor = pr.id
      ORDER BY p.id DESC
      LIMIT 5
    `);

    if (productos.rows.length > 0) {
      productos.rows.forEach(p => {
        console.log(`\n   ID: ${p.id}`);
        console.log(`   Código: ${p.codigo}`);
        console.log(`   Nombre: ${p.nombre}`);
        console.log(`   Precio: $${p.precio_venta || 0}`);
        console.log(`   Stock: ${p.stock_actual}`);
        console.log(`   Categoría: ${p.categoria || 'N/A'}`);
        console.log(`   Proveedor: ${p.proveedor || 'N/A'}`);
        console.log(`   ${'─'.repeat(40)}`);
      });
    }

    // Verificar clientes recientes
    console.log('\n\n👥 CLIENTES RECIENTES:');
    const clientes = await pool.query(`
      SELECT id, nombre, cedula, correo, telefono
      FROM cliente
      ORDER BY id DESC
      LIMIT 5
    `);

    if (clientes.rows.length > 0) {
      clientes.rows.forEach(c => {
        console.log(`\n   ID: ${c.id}`);
        console.log(`   Nombre: ${c.nombre}`);
        console.log(`   Cédula: ${c.cedula}`);
        console.log(`   Email: ${c.correo || 'N/A'}`);
        console.log(`   Teléfono: ${c.telefono || 'N/A'}`);
        console.log(`   ${'─'.repeat(40)}`);
      });
    }

    // Estadísticas
    console.log('\n\n📊 ESTADÍSTICAS:');
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM producto) as total_productos,
        (SELECT COUNT(*) FROM cliente) as total_clientes,
        (SELECT COUNT(*) FROM proveedor) as total_proveedores,
        (SELECT COUNT(*) FROM categoria) as total_categorias
    `);

    const st = stats.rows[0];
    console.log(`   Total Productos: ${st.total_productos}`);
    console.log(`   Total Clientes: ${st.total_clientes}`);
    console.log(`   Total Proveedores: ${st.total_proveedores}`);
    console.log(`   Total Categorías: ${st.total_categorias}`);

    await pool.end();

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verificarDatos();
