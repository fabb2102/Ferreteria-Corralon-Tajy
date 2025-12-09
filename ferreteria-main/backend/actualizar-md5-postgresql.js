#!/usr/bin/env node

/**
 * Script para actualizar contraseñas a MD5 en PostgreSQL
 * 
 * Este script actualiza las contraseñas de admin y vendedor
 * para usar hashes MD5 como requiere el nuevo sistema.
 */

const { Client } = require('pg');
const crypto = require('crypto');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  database: 'sistema_ventas',
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'tu_password_aqui', // Cambia esto por tu contraseña
  port: 5432,
};

// Función para generar hash MD5
const hashPasswordMD5 = (plainPassword) => {
  return crypto.createHash('md5').update(plainPassword).digest('hex');
};

// Usuarios a actualizar con MD5
const usuariosActualizar = [
  {
    email: 'admin@ferreteria.com',
    passwordPlano: 'admin123',
    expectedMD5: '0192023a7bbd73250516f069df18b500'
  },
  {
    email: 'vendedor@ferreteria.com', 
    passwordPlano: 'vendedor123',
    expectedMD5: 'a60c36fc7c825e68bb5371a0e08f828a'
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

async function actualizarUsuarioMD5(client, email, md5Hash) {
  try {
    const query = `
      UPDATE usuario 
      SET contrasenha = $1 
      WHERE email = $2 AND activo = true
      RETURNING id, email, nombre
    `;
    
    const result = await client.query(query, [md5Hash, email]);
    
    if (result.rows.length > 0) {
      const usuario = result.rows[0];
      console.log(`   ✅ ${usuario.email} (${usuario.nombre}) - Contraseña actualizada a MD5`);
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

async function mostrarUsuariosActuales(client) {
  try {
    const query = `
      SELECT id, email, nombre, contrasenha,
             CASE 
               WHEN LENGTH(contrasenha) = 32 AND contrasenha ~ '^[a-f0-9]+$' THEN 'MD5'
               WHEN contrasenha LIKE '$2%' THEN 'bcrypt'
               ELSE 'Texto plano'
             END as tipo_hash
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
        const hashPreview = user.contrasenha.length > 20 ? 
          user.contrasenha.substring(0, 20) + '...' : 
          user.contrasenha;
        console.log(`   📧 ${user.email} (${user.nombre})`);
        console.log(`      🔐 Tipo: ${user.tipo_hash} | Hash: ${hashPreview}`);
      });
    }
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error consultando usuarios:', error.message);
    return [];
  }
}

async function verificarMD5() {
  console.log('🧪 Verificando generación de MD5...\n');
  
  usuariosActualizar.forEach(user => {
    const generatedMD5 = hashPasswordMD5(user.passwordPlano);
    const isCorrect = generatedMD5 === user.expectedMD5;
    
    console.log(`🔐 ${user.passwordPlano} → ${generatedMD5}`);
    console.log(`   ✅ Esperado: ${user.expectedMD5}`);
    console.log(`   ${isCorrect ? '✅' : '❌'} ${isCorrect ? 'Correcto' : 'ERROR'}\n`);
  });
}

async function main() {
  console.log('🔐 ACTUALIZACIÓN A MD5 - POSTGRESQL');
  console.log('===================================\n');
  
  // Verificar generación de MD5
  await verificarMD5();
  
  const client = await conectarBD();
  
  try {
    // Mostrar usuarios actuales
    await mostrarUsuariosActuales(client);
    
    console.log('\n🔄 Iniciando actualización a MD5...\n');
    
    let exitosos = 0;
    let errores = 0;
    
    for (const userData of usuariosActualizar) {
      console.log(`🔄 Procesando: ${userData.email}`);
      
      try {
        // Generar MD5
        const md5Hash = hashPasswordMD5(userData.passwordPlano);
        console.log(`   🔐 MD5 generado: ${md5Hash}`);
        
        // Actualizar en la base de datos
        const actualizado = await actualizarUsuarioMD5(client, userData.email, md5Hash);
        
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
    console.log(`✅ Contraseñas actualizadas a MD5: ${exitosos}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📈 Total procesados: ${usuariosActualizar.length}`);
    
    if (exitosos > 0) {
      console.log('\n🎉 ¡Contraseñas actualizadas a MD5 exitosamente!');
      console.log('\n🔐 Credenciales para login (sin cambios):');
      usuariosActualizar.forEach(user => {
        console.log(`   • ${user.email} / ${user.passwordPlano}`);
      });
      
      console.log('\n🔄 Tu backend ya está configurado para MD5');
      console.log('   El login ahora usa: WHERE email = ? AND contrasenha = MD5(?)');
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

module.exports = { main, hashPasswordMD5, dbConfig };