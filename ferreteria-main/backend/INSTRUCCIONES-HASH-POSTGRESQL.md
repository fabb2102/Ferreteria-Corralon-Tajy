# 🔐 Instrucciones - Hasheo de Contraseñas PostgreSQL

## 📋 Requisitos Previos

1. **PostgreSQL ejecutándose**
2. **Base de datos `sistema_ventas` creada**
3. **Tabla `usuario` con estructura correcta**

## 🚀 Cómo Ejecutar

### Paso 1: Configurar la Contraseña

Edita el archivo `hash-passwords.js` línea 17:

```javascript
password: 'TU_PASSWORD_POSTGRESQL_AQUI', // Cambia esto
```

**O usa variable de entorno:**

```bash
export DB_PASSWORD=tu_password_real
```

### Paso 2: Verificar Dependencias

```bash
# Navegar a la carpeta backend
cd backend

# Las dependencias ya están instaladas (bcryptjs y pg)
# Si necesitas reinstalar:
npm install bcryptjs pg
```

### Paso 3: Ejecutar el Script

```bash
node hash-passwords.js
```

## 📊 Salida Esperada

```
🔐 HASHEO DE CONTRASEÑAS - POSTGRESQL
=====================================

✅ Conectado a PostgreSQL
📋 Base de datos: sistema_ventas
🖥️  Host: localhost:5432
📋 Columnas encontradas: id, email, contrasenha, nombre, activo

👥 Usuarios actuales:
   📧 admin@ferreteria.com (Administrador) - Texto plano
   📧 vendedor@ferreteria.com (Juan Vendedor) - Texto plano

🔄 Iniciando proceso de hasheo...

🔄 Procesando: admin@ferreteria.com
   ✅ admin@ferreteria.com (Administrador) - Contraseña actualizada
🔄 Procesando: vendedor@ferreteria.com
   ✅ vendedor@ferreteria.com (Juan Vendedor) - Contraseña actualizada

👥 Estado final de usuarios:
   📧 admin@ferreteria.com (Administrador) - Hasheada
   📧 vendedor@ferreteria.com (Juan Vendedor) - Hasheada

📊 RESUMEN
==========
✅ Contraseñas actualizadas: 2
❌ Errores: 0
📈 Total procesados: 2

🎉 ¡Contraseñas hasheadas exitosamente!

🔐 Credenciales para login (sin cambios):
   • admin@ferreteria.com / admin123
   • vendedor@ferreteria.com / vendedor123

🔄 Reinicia tu servidor backend para aplicar los cambios
🔌 Conexión cerrada
```

## 🗄️ Estructura de Base de Datos Requerida

```sql
-- Crear la base de datos
CREATE DATABASE sistema_ventas;

-- Usar la base de datos
\c sistema_ventas;

-- Crear tabla usuario
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasenha VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuarios de prueba (antes de hashear)
INSERT INTO usuario (email, contrasenha, nombre, activo) VALUES
('admin@ferreteria.com', 'admin123', 'Administrador', true),
('vendedor@ferreteria.com', 'vendedor123', 'Juan Vendedor', true);
```

## 🔧 Solución de Problemas

### Error: "database sistema_ventas does not exist"

```bash
# Conectar a PostgreSQL como superusuario
psql -U postgres

# Crear la base de datos
CREATE DATABASE sistema_ventas;
\q
```

### Error: "relation usuario does not exist"

```bash
# Conectar a la base de datos
psql -U postgres -d sistema_ventas

# Crear la tabla
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasenha VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT true
);
\q
```

### Error: "column contrasenha does not exist"

El script usa la columna `contrasenha`. Si tu tabla usa `password`, edita la línea 71 del script:

```javascript
// Cambiar de:
SET contrasenha = $1 

// A:
SET password = $1
```

### Error de Conexión

1. **Verifica PostgreSQL esté ejecutándose:**
   ```bash
   # En macOS con Homebrew:
   brew services start postgresql
   
   # En Linux:
   sudo systemctl start postgresql
   ```

2. **Verifica la contraseña en el script**

3. **Verifica el puerto (por defecto 5432)**

## 🔄 Después de Ejecutar

1. **Reinicia tu servidor backend**
2. **Las credenciales siguen siendo las mismas:**
   - `admin@ferreteria.com` / `admin123`
   - `vendedor@ferreteria.com` / `vendedor123`
3. **Las contraseñas ahora están seguras en la BD**

## ⚡ Ejecución Rápida

```bash
cd backend
export DB_PASSWORD=tu_password
node hash-passwords.js
```