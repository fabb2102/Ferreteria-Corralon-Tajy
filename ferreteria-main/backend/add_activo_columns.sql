-- Script para agregar columnas 'activo' a las tablas cliente y proveedor
-- Ejecuta este script en tu base de datos PostgreSQL

-- Agregar columna 'activo' a la tabla cliente
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Agregar columna 'activo' a la tabla proveedor
ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Actualizar registros existentes para asegurar que tengan el valor por defecto
UPDATE cliente SET activo = true WHERE activo IS NULL;
UPDATE proveedor SET activo = true WHERE activo IS NULL;

-- Confirmación
SELECT 'Columnas agregadas exitosamente' AS resultado;
