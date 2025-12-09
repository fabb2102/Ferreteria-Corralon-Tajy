#!/usr/bin/env node

/**
 * Script para hashear las contraseñas en el sistema de memoria actual
 * 
 * Este script modifica directamente el archivo index.js para usar contraseñas hasheadas
 * en lugar de texto plano en los datos de usuarios en memoria.
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const SALT_ROUNDS = 12;
const INDEX_FILE = path.join(__dirname, 'index.js');

async function hashearPasswordsEnMemoria() {
  console.log('🔐 HASHEO DE CONTRASEÑAS - SISTEMA EN MEMORIA');
  console.log('==============================================\n');

  try {
    // Leer el archivo index.js
    const contenidoOriginal = fs.readFileSync(INDEX_FILE, 'utf8');
    
    console.log('📋 Leyendo archivo index.js...');
    
    // Hashear las contraseñas
    console.log('🔄 Hasheando contraseñas...');
    const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    const vendedorHash = await bcrypt.hash('vendedor123', SALT_ROUNDS);
    
    console.log('✅ Contraseñas hasheadas exitosamente');
    
    // Reemplazar en el contenido
    let contenidoNuevo = contenidoOriginal;
    
    // Reemplazar la sección de usuarios
    const patronUsuarios = /\/\/ Default users \(passwords will be hashed using the hashear-passwords\.js script\)[\s\S]*?};/;
    
    const nuevaSeccionUsuarios = `// Default users (passwords hashed with bcrypt)
let usuarios = [
  { 
    id: 1, 
    email: 'admin@ferreteria.com', 
    password: '${adminHash}', 
    nombre: 'Administrador', 
    rolId: 1,
    activo: true 
  },
  { 
    id: 2, 
    email: 'vendedor@ferreteria.com', 
    password: '${vendedorHash}', 
    nombre: 'Juan Vendedor', 
    rolId: 2,
    activo: true 
  }
];`;

    contenidoNuevo = contenidoNuevo.replace(patronUsuarios, nuevaSeccionUsuarios);
    
    // Crear backup
    const backupFile = INDEX_FILE + '.backup.' + Date.now();
    fs.writeFileSync(backupFile, contenidoOriginal);
    console.log(`💾 Backup creado: ${path.basename(backupFile)}`);
    
    // Escribir el nuevo contenido
    fs.writeFileSync(INDEX_FILE, contenidoNuevo);
    
    console.log('\n📊 RESUMEN DE OPERACIONES');
    console.log('==========================');
    console.log('✅ admin@ferreteria.com - Contraseña hasheada');
    console.log('✅ vendedor@ferreteria.com - Contraseña hasheada');
    console.log('💾 Backup del archivo original creado');
    console.log('📝 Archivo index.js actualizado');
    
    console.log('\n🎉 ¡Hasheo completado exitosamente!');
    console.log('\n🔐 Credenciales (siguen siendo las mismas para login):');
    console.log('   • admin@ferreteria.com / admin123');
    console.log('   • vendedor@ferreteria.com / vendedor123');
    
    console.log('\n🔄 Próximos pasos:');
    console.log('   1. Reinicia el servidor backend (Ctrl+C y npm start)');
    console.log('   2. Las contraseñas ahora están hasheadas y seguras');
    console.log('   3. El login seguirá funcionando con las mismas credenciales');

  } catch (error) {
    console.error('❌ Error durante el hasheo:', error.message);
    process.exit(1);
  }
}

// Ejecutar si el script se llama directamente
if (require.main === module) {
  hashearPasswordsEnMemoria();
}