// Importar módulos necesarios
const { Pool } = require('pg');
require('dotenv').config();

/**
 * Configuración del Pool de Conexiones PostgreSQL
 *
 * Pool maneja automáticamente múltiples conexiones a la base de datos,
 * reutilizando conexiones existentes y creando nuevas cuando sea necesario.
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Configuración adicional del pool
  max: 20,                    // Máximo número de clientes en el pool
  idleTimeoutMillis: 30000,   // Tiempo máximo que un cliente puede estar inactivo antes de ser cerrado
  connectionTimeoutMillis: 2000, // Tiempo máximo de espera para obtener una conexión
});

/**
 * Manejador de errores del pool
 * Se ejecuta cuando ocurre un error en una conexión inactiva
 */
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente inactivo de PostgreSQL:', err);
  process.exit(-1);
});

/**
 * Función para probar la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');

    // Ejecutar una consulta simple para verificar la conexión
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora del servidor de base de datos:', result.rows[0].now);

    // Liberar el cliente de vuelta al pool
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

// Probar la conexión al iniciar el módulo
testConnection();

// Exportar el pool para usarlo en otras partes de la aplicación
module.exports = pool;
