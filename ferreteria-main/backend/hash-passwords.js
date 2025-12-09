#!/usr/bin/env node

/**
 * Script para hashear contraseñas en PostgreSQL
 * 
 * Este script actualiza las contraseñas de admin y vendedor
 * de texto plano a hashes bcrypt seguros.
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  database: 'sistema_ventas',
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'tu_password_aqui', // Cambia esto por tu contraseña
  port: 5432,
};

// Configuración de bcrypt
const SALT_ROUNDS = 12;

// Usuarios a actualizar
const usuariosActualizar = [
  {
    email: 'admin@ferreteria.com',
    passwordPlano: 'admin123'
  },
  {
    email: 'vendedor@ferreteria.com', 
    passwordPlano: 'vendedor123'
  }
];

async function conectarBD() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');
    console.log(`📋 Base de datos: ${dbConfig.database}`);
    console.log(`🖥️  Host: ${dbConfig.host}:${dbConfig.port}`);
    return client;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\n🔧 Verifica:');
    console.error('   • PostgreSQL está ejecutándose');
    console.error('   • La base de datos "sistema_ventas" existe');
    console.error('   • Las credenciales son correctas');
    console.error('   • El puerto 5432 está disponible');
    process.exit(1);
  }
}

async function hashearPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error(`❌ Error hasheando contraseña: ${error.message}`);
    throw error;
  }
}

async function actualizarUsuario(client, email, hashedPassword) {
  try {
    // Actualizar usando la columna 'contrasenha' (según el esquema mencionado)
    const query = `
      UPDATE usuario 
      SET contrasenha = $1 
      WHERE email = $2 AND activo = true
      RETURNING id, email, nombre
    `;
    
    const result = await client.query(query, [hashedPassword, email]);
    
    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      console.log(`   ✅ ${usuario.email} (${usuario.nombre}) - Contraseña actualizada`);
      return true;
    } else {
      console.log(`   ⚠️  ${email} - Usuario no encontrado o inactivo`);
      return false;
    }
    
  } catch (error) {
    console.error(`   ❌ Error actualizando ${email}: ${error.message}`);
    return false;
  }
}

async function verificarTabla(client) {
  try {
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuario' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.error('❌ La tabla "usuario" no existe');
      console.error('\n💡 Asegúrate de que la tabla usuario esté creada con:');
      console.error('   CREATE TABLE usuario (');
      console.error('     id SERIAL PRIMARY KEY,');
      console.error('     email VARCHAR(255) UNIQUE NOT NULL,');
      console.error('     contrasenha VARCHAR(255) NOT NULL,');
      console.error('     nombre VARCHAR(255) NOT NULL,');
      console.error('     activo BOOLEAN DEFAULT true');
      console.error('   );');
      process.exit(1);
    }
    
    const columnas = result.rows.map(row => row.column_name);
    console.log(`📋 Columnas encontradas: ${columnas.join(', ')}`);
    
    if (!columnas.includes('contrasenha')) {
      console.error('❌ La columna "contrasenha" no existe');
      console.error('💡 Verifica que la tabla use "contrasenha" no "password"');
      process.exit(1);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando tabla:', error.message);
    process.exit(1);
  }
}

async function mostrarUsuariosActuales(client) {
  try {
    const query = `
      SELECT id, email, nombre, 
             CASE 
               WHEN contrasenha LIKE '$2%' THEN 'Hasheada'
               ELSE 'Texto plano'
             END as estado_password
      FROM usuario 
      WHERE activo = true 
      ORDER BY id
    `;
    
    const result = await client.query(query);
    
    console.log('\n👥 Usuarios actuales:');
    if (result.rows.length === 0) {
      console.log('   ⚠️  No se encontraron usuarios activos');
    } else {
      result.rows.forEach(user => {
        console.log(`   📧 ${user.email} (${user.nombre}) - ${user.estado_password}`);
      });
    }
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error consultando usuarios:', error.message);
    return [];
  }
}

async function main() {
  console.log('🔐 HASHEO DE CONTRASEÑAS - POSTGRESQL');
  console.log('=====================================\n');
  
  const client = await conectarBD();
  
  try {
    // Verificar que la tabla existe
    await verificarTabla(client);
    
    // Mostrar usuarios actuales
    await mostrarUsuariosActuales(client);
    
    console.log('\n🔄 Iniciando proceso de hasheo...\n');
    
    let exitosos = 0;
    let errores = 0;
    
    for (const userData of usuariosActualizar) {
      console.log(`🔄 Procesando: ${userData.email}`);
      
      try {
        // Hashear la contraseña
        const hashedPassword = await hashearPassword(userData.passwordPlano);
        
        // Actualizar en la base de datos
        const actualizado = await actualizarUsuario(client, userData.email, hashedPassword);
        
        if (actualizado) {
          exitosos++;
        } else {
          errores++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error procesando ${userData.email}: ${error.message}`);
        errores++;
      }
    }
    
    // Mostrar estado final
    console.log('\n👥 Estado final de usuarios:');
    await mostrarUsuariosActuales(client);
    
    // Resumen
    console.log('\n📊 RESUMEN');
    console.log('==========');
    console.log(`✅ Contraseñas actualizadas: ${exitosos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📈 Total procesados: ${usuariosActualizar.length}`);
    
    if (exitosos > 0) {
      console.log('\n🎉 ¡Contraseñas hasheadas exitosamente!');
      console.log('\n🔐 Credenciales para login (sin cambios):');
      usuariosActualizar.forEach(user => {
        console.log(`   • ${user.email} / ${user.passwordPlano}`);
      });
      
      console.log('\n🔄 Reinicia tu servidor backend para aplicar los cambios');
    }
    
    if (errores > 0) {
      console.log('\n⚠️  Se encontraron errores. Revisa los mensajes anteriores.');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la ejecución:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { main, dbConfig };