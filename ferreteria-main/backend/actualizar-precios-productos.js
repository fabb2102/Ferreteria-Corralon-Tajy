/**
 * Script para actualizar precios de productos que tienen $0
 */

const pool = require('./config/database');

const actualizarPrecios = async () => {
  console.log('\n🔧 ACTUALIZANDO PRECIOS DE PRODUCTOS\n');

  try {
    // Actualizar productos sin precio
    const updates = [
      { id: 1, nombre: 'Producto 1', precio: 15000 },
      { id: 2, nombre: 'Producto 2', precio: 20000 },
      { id: 3, nombre: 'Producto 3', precio: 12000 },
      { id: 4, nombre: 'martillo', precio: 35000 },
      { id: 5, nombre: 'llave inglesa', precio: 28000 },
      { id: 6, nombre: 'Martillo', precio: 38000 },
      { id: 8, nombre: 'Destornillador', precio: 18000 }
    ];

    for (const { id, nombre, precio } of updates) {
      const result = await pool.query(
        'UPDATE producto SET precio_venta = $1 WHERE id = $2 RETURNING id, nombre, precio_venta, activo',
        [precio, id]
      );

      if (result.rows.length > 0) {
        const p = result.rows[0];
        console.log(`✅ ${p.nombre.padEnd(30)} - Precio: $${p.precio_venta} - Activo: ${p.activo}`);
      }
    }

    // Activar productos inactivos con precio
    await pool.query('UPDATE producto SET activo = true WHERE precio_venta > 0');
    console.log('\n✅ Todos los productos con precio ahora están activos');

    // Mostrar resumen
    const resumen = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE activo = true) as activos,
        COUNT(*) FILTER (WHERE precio_venta > 0) as con_precio
      FROM producto
    `);

    console.log('\n📊 RESUMEN:');
    console.log(`   Total productos: ${resumen.rows[0].total}`);
    console.log(`   Productos activos: ${resumen.rows[0].activos}`);
    console.log(`   Productos con precio: ${resumen.rows[0].con_precio}`);

    // Listar productos activos
    const activos = await pool.query(`
      SELECT id, nombre, codigo, precio_venta, stock_actual
      FROM producto
      WHERE activo = true
      ORDER BY nombre
    `);

    console.log('\n📦 PRODUCTOS ACTIVOS CON PRECIO:');
    activos.rows.forEach(p => {
      console.log(`   ${String(p.id).padStart(2)}. ${p.nombre.padEnd(35)} $${String(p.precio_venta).padStart(6)} - Stock: ${p.stock_actual}`);
    });

    await pool.end();
    console.log('\n✅ Actualización completada\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

actualizarPrecios();
