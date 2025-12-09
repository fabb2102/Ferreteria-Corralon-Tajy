# 🔐 Guía de Seguridad de Contraseñas - Ferretería

## 📋 Resumen

Este documento explica cómo implementar y usar el sistema de seguridad de contraseñas con bcrypt en el proyecto de ferretería.

## ✅ Implementaciones Realizadas

### 1. Autenticación Mejorada
- ✅ **Compatibilidad retroactiva**: El sistema ahora soporta tanto contraseñas hasheadas como texto plano
- ✅ **Detección automática**: Identifica si una contraseña está hasheada o en texto plano
- ✅ **Verificación segura**: Usa `bcrypt.compare()` para contraseñas hasheadas

### 2. Script de Hasheo Automático
- ✅ **Script creado**: `hashear-passwords.js` para hashear contraseñas existentes
- ✅ **Conexión PostgreSQL**: Configurado para trabajar con base de datos real
- ✅ **Detección inteligente**: Identifica contraseñas que necesitan ser hasheadas
- ✅ **Reporte detallado**: Muestra resumen completo de operaciones

## 🚀 Cómo Usar

### Paso 1: Configurar Variables de Entorno (Opcional)

Crea un archivo `.env` en la carpeta `backend` con tu configuración de PostgreSQL:

```bash
# Configuración de Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ferreteria
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
```

### Paso 2: Ejecutar el Script de Hasheo

```bash
# Navegar a la carpeta backend
cd backend

# Ejecutar el script de hasheo
node hashear-passwords.js
```

### Salida Esperada:

```
🔐 SCRIPT DE HASHEO DE CONTRASEÑAS - FERRETERÍA
================================================

✅ Conectado a la base de datos PostgreSQL
📋 Encontrados 2 usuarios activos en la base de datos

🔍 Analizando contraseñas...
   📝 admin@ferreteria.com - Contraseña en texto plano detectada
   📝 vendedor@ferreteria.com - Contraseña en texto plano detectada

🔧 Procesando 2 usuarios con contraseñas en texto plano...

   🔄 Procesando: admin@ferreteria.com
   ✅ admin@ferreteria.com - Contraseña hasheada y actualizada
   🔄 Procesando: vendedor@ferreteria.com
   ✅ vendedor@ferreteria.com - Contraseña hasheada y actualizada

📊 RESUMEN DE OPERACIONES
==========================
✅ Usuarios procesados exitosamente: 2
❌ Errores encontrados: 0
ℹ️  Usuarios ya hasheados (sin cambios): 0
📈 Total de usuarios en la base de datos: 2

🎉 ¡Hasheo de contraseñas completado exitosamente!
```

## 🔧 Configuración de Base de Datos

### Esquema Esperado de la Tabla Usuario:

```sql
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasenha VARCHAR(255) NOT NULL,  -- Nota: usa 'contrasenha' no 'password'
    nombre VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES rol(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Datos de Ejemplo:

```sql
-- Estos usuarios serán hasheados por el script
INSERT INTO usuario (email, contrasenha, nombre, rol_id, activo) VALUES
('admin@ferreteria.com', 'admin123', 'Administrador', 1, true),
('vendedor@ferreteria.com', 'vendedor123', 'Juan Vendedor', 2, true);
```

## 🔄 Funcionamiento del Sistema

### Autenticación Actual:

1. **Usuario ingresa credenciales** → `admin@ferreteria.com / admin123`
2. **Sistema verifica formato de contraseña en BD**:
   - Si empieza con `$2` → Usa `bcrypt.compare()`
   - Si no → Compara directamente (compatibilidad retroactiva)
3. **Login exitoso** → JWT generado

### Después del Script de Hasheo:

1. **Usuario ingresa las mismas credenciales** → `admin@ferreteria.com / admin123`
2. **Sistema detecta contraseña hasheada en BD** → `$2b$12$...`
3. **Usa bcrypt.compare()** → Verifica hash vs texto plano
4. **Login exitoso** → JWT generado

## 📝 Para Futuros Desarrollos

### Creación de Nuevos Usuarios:

Cuando implementes endpoints para crear/editar usuarios, usa la función helper:

```javascript
// Ejemplo para crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { email, password, nombre, rolId } = req.body;
  
  // Hashear la contraseña antes de guardar
  const hashedPassword = await hashPassword(password);
  
  // Guardar en BD con contraseña hasheada
  const nuevoUsuario = {
    email,
    password: hashedPassword,  // ← Hasheada automáticamente
    nombre,
    rolId
  };
  
  // ... resto de la lógica
});
```

## 🛡️ Características de Seguridad

- **🔐 bcrypt con 12 rondas de salt**: Altamente seguro contra ataques de fuerza bruta
- **🔄 Compatibilidad retroactiva**: No rompe funcionalidad existente
- **🔍 Detección automática**: Identifica formato de contraseñas automáticamente
- **📊 Logging detallado**: Reportes completos de operaciones
- **⚡ Ejecución única**: El script puede ejecutarse múltiples veces sin problemas

## 🆘 Solución de Problemas

### Error de Conexión a PostgreSQL:
```
❌ Error conectando a la base de datos: ...
```

**Soluciones**:
1. Verificar que PostgreSQL esté ejecutándose
2. Comprobar credenciales en variables de entorno o script
3. Verificar que la base de datos exista
4. Comprobar conectividad de red

### Error de Tabla No Encontrada:
```
❌ Error obteniendo usuarios: relation "usuario" does not exist
```

**Soluciones**:
1. Verificar que la tabla `usuario` exista
2. Ajustar nombre de tabla en el script si es diferente
3. Verificar permisos del usuario de BD

### Usuarios Ya Hasheados:
```
🎉 ¡Todas las contraseñas ya están hasheadas!
```

**Esto es normal** si ya ejecutaste el script antes. Las contraseñas ya están seguras.

## 📞 Credenciales Actuales

Después de ejecutar el script, las credenciales siguen siendo las mismas para el usuario:

- **Admin**: `admin@ferreteria.com` / `admin123`
- **Vendedor**: `vendedor@ferreteria.com` / `vendedor123`

La diferencia es que ahora están almacenadas de forma segura como hashes bcrypt en la base de datos.