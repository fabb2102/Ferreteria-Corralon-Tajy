# Script para limpiar productos duplicados

## Opción 1: Ejecutar en la consola del navegador

Abre la consola del navegador (F12) y ejecuta este código:

```javascript
// Limpiar productos duplicados
const productos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
console.log('Productos antes:', productos.length);
console.log('IDs:', productos.map(p => p.id));

const productosUnicos = [];
const idsVistos = new Set();

productos.forEach(producto => {
  if (!idsVistos.has(producto.id)) {
    idsVistos.add(producto.id);
    productosUnicos.push(producto);
  } else {
    console.log('Duplicado eliminado:', producto.id, producto.nombre);
  }
});

localStorage.setItem('todolosproductos', JSON.stringify(productosUnicos));
console.log('Productos después:', productosUnicos.length);
console.log('✅ Limpieza completada. Recarga la página.');

// Recargar la página
location.reload();
```

## Opción 2: Borrar todo y empezar de nuevo

Si quieres empezar desde cero:

```javascript
localStorage.removeItem('todolosproductos');
console.log('✅ Productos eliminados. Recarga la página y los productos se cargarán del backend.');
location.reload();
```

## Verificar los productos actuales

Para ver qué productos tienes actualmente:

```javascript
const productos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
console.table(productos.map(p => ({ id: p.id, nombre: p.nombre, activo: p.activo })));
```
