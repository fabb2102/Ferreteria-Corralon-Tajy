#!/usr/bin/env node

/**
 * Script para hashear las contraseñas de usuarios en la base de datos PostgreSQL
 * 
 * Este script:
 * 1. Se conecta a la base de datos PostgreSQL
 * 2. Lee todos los usuarios existentes
 * 3. Identifica contraseñas en texto plano (como 'admin123', 'vendedor123')
 * 4. Las hashea usando bcrypt
 * 5. Actualiza la base de datos con los hashes
 * 6. Muestra un resumen de las operaciones realizadas
 * 
 * Uso: node hashear-passwords.js
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Configuración de la base de datos PostgreSQL
// Ajusta estos valores según tu configuración
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ferreteria',
  password: process.env.DB_PASSWORD || 'tu_password_aqui',
  port: process.env.DB_PORT || 5432,
};

// Configuración de bcrypt
const SALT_ROUNDS = 12; // Número de rondas de salt (más alto = más seguro pero más lento)

// Contraseñas conocidas que necesitan ser hasheadas
const KNOWN_PLAIN_PASSWORDS = [
  'admin123',
  'vendedor123',
  '123456',
  'password',
  'admin',
  'vendedor'
];

async function conectarBaseDatos() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');
    return client;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    console.error('\n📋 Verifica que:');
    console.error('   • PostgreSQL esté ejecutándose');
    console.error('   • Las credenciales sean correctas');
    console.error('   • La base de datos exista');
    console.error('\n🔧 Configuración actual:');
    console.error(`   • Host: ${dbConfig.host}`);
    console.error(`   • Puerto: ${dbConfig.port}`);
    console.error(`   • Base de datos: ${dbConfig.database}`);
    console.error(`   • Usuario: ${dbConfig.user}`);
    process.exit(1);
  }
}

async function obtenerUsuarios(client) {
  try {
    // Ajusta el nombre de la tabla y columnas según tu esquema
    const query = `
      SELECT id, email, contrasenha as password, nombre, activo 
      FROM usuario 
      WHERE activo = true
    `;
    
    const result = await client.query(query);
    console.log(`📋 Encontrados ${result.rows.length} usuarios activos en la base de datos`);
    return result.rows;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   • Verifica que la tabla "usuario" exista');
    console.error('   • Verifica que las columnas sean: id, email, contrasenha, nombre, activo');
    console.error('   • Ajusta el nombre de la tabla/columnas en el script si es necesario');
    throw error;
  }
}

function esPasswordPlano(password) {
  // Verifica si la contraseña NO está hasheada
  // Las contraseñas hasheadas con bcrypt empiezan con $2a$, $2b$, $2x$, o $2y$
  if (password.startsWith('$2')) {
    return false; // Ya está hasheada
  }
  
  // Verifica si es una de las contraseñas conocidas en texto plano
  return KNOWN_PLAIN_PASSWORDS.includes(password) || password.length < 20;
}

async function hashearPassword(plainPassword) {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error(`❌ Error hasheando contraseña: ${error.message}`);
    throw error;
  }
}

async function actualizarPasswordUsuario(client, userId, hashedPassword) {
  try {
    // Ajusta el nombre de la tabla y columna según tu esquema
    const query = `
      UPDATE usuario 
      SET contrasenha = $1 
      WHERE id = $2
    `;
    
    await client.query(query, [hashedPassword, userId]);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando usuario ${userId}:`, error.message);
    return false;
  }
}

async function procesarUsuarios() {
  console.log('🔐 SCRIPT DE HASHEO DE CONTRASEÑAS - FERRETERÍA');
  console.log('================================================\n');
  
  const client = await conectarBaseDatos();
  
  try {
    const usuarios = await obtenerUsuarios(client);
    
    if (usuarios.length === 0) {
      console.log('ℹ️  No se encontraron usuarios para procesar');
      return;
    }
    
    console.log('\n🔍 Analizando contraseñas...');
    
    let usuariosConPasswordPlano = [];
    let usuariosYaHasheados = [];
    
    for (const usuario of usuarios) {
      if (esPasswordPlano(usuario.password)) {
        usuariosConPasswordPlano.push(usuario);
        console.log(`   📝 ${usuario.email} - Contraseña en texto plano detectada`);
      } else {
        usuariosYaHasheados.push(usuario);
        console.log(`   ✅ ${usuario.email} - Contraseña ya hasheada`);
      }
    }
    
    if (usuariosConPasswordPlano.length === 0) {
      console.log('\n🎉 ¡Todas las contraseñas ya están hasheadas!');
      console.log('   No es necesario realizar ninguna actualización.');
      return;
    }
    
    console.log(`\n🔧 Procesando ${usuariosConPasswordPlano.length} usuarios con contraseñas en texto plano...\n`);
    
    let exitosos = 0;
    let errores = 0;
    
    for (const usuario of usuariosConPasswordPlano) {
      try {
        console.log(`   🔄 Procesando: ${usuario.email}`);
        
        // Hashear la contraseña
        const hashedPassword = await hashearPassword(usuario.password);
        
        // Actualizar en la base de datos
        const actualizado = await actualizarPasswordUsuario(client, usuario.id, hashedPassword);
        
        if (actualizado) {
          console.log(`   ✅ ${usuario.email} - Contraseña hasheada y actualizada`);
          exitosos++;
        } else {
          console.log(`   ❌ ${usuario.email} - Error actualizando en la base de datos`);
          errores++;
        }
        
      } catch (error) {
        console.error(`   ❌ ${usuario.email} - Error: ${error.message}`);
        errores++;
      }
    }
    
    // Resumen final
    console.log('\n📊 RESUMEN DE OPERACIONES');
    console.log('==========================');
    console.log(`✅ Usuarios procesados exitosamente: ${exitosos}`);
    console.log(`❌ Errores encontrados: ${errores}`);
    console.log(`ℹ️  Usuarios ya hasheados (sin cambios): ${usuariosYaHasheados.length}`);
    console.log(`📈 Total de usuarios en la base de datos: ${usuarios.length}`);
    
    if (exitosos > 0) {
      console.log('\n🎉 ¡Hasheo de contraseñas completado exitosamente!');
      console.log('   Las contraseñas ahora están seguras y encriptadas.');
      console.log('\n🔐 Credenciales actualizadas:');
      for (const usuario of usuariosConPasswordPlano.slice(0, exitosos)) {
        console.log(`   • ${usuario.email} / ${usuario.password} (ahora hasheada)`);
      }
    }
    
    if (errores > 0) {
      console.log('\n⚠️  Se encontraron errores durante el proceso.');
      console.log('   Revisa los mensajes anteriores para más detalles.');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante el procesamiento:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión a la base de datos cerrada');
  }
}

// Función principal
async function main() {
  try {
    await procesarUsuarios();
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Verificar si el script se está ejecutando directamente
if (require.main === module) {
  main();
}

module.exports = {
  procesarUsuarios,
  dbConfig,
  SALT_ROUNDS
};