import React, { useState, useEffect, useRef } from 'react';
import '../styles/NuevoComprobante.css';
import { generateAndDownloadInvoice } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/currency';

function NuevaVenta() {
  const [venta, setVenta] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    clienteDireccion: '',
    fecha: new Date().toISOString().split('T')[0],
    productos: [{ productoId: '', nombre: '', cantidad: 1, precio: 0, costo: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);

  // Refs para los atajos de teclado
  const clienteSelectRef = useRef(null);
  const primerProductoSelectRef = useRef(null);
  const formRef = useRef(null);

  const limpiarDuplicadosLocalStorage = () => {
    try {
      const productos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
      console.log(`📊 Productos en localStorage antes de limpiar: ${productos.length}`);

      // Ver IDs de productos para debugging
      const ids = productos.map(p => p.id);
      console.log('IDs encontrados:', ids);

      // Eliminar duplicados manteniendo solo la primera ocurrencia de cada ID
      const productosUnicos = [];
      const idsVistos = new Set();

      productos.forEach(producto => {
        if (!idsVistos.has(producto.id)) {
          idsVistos.add(producto.id);
          productosUnicos.push(producto);
        } else {
          console.log(`❌ Producto duplicado encontrado: ID ${producto.id} - ${producto.nombre}`);
        }
      });

      if (productosUnicos.length !== productos.length) {
        console.log(`🧹 Limpiando duplicados: ${productos.length} -> ${productosUnicos.length} productos`);
        localStorage.setItem('todolosproductos', JSON.stringify(productosUnicos));
      } else {
        console.log('✅ No hay duplicados que limpiar');
      }

      return productosUnicos.length;
    } catch (error) {
      console.error('Error al limpiar duplicados:', error);
      return 0;
    }
  };

  useEffect(() => {
    limpiarDuplicadosLocalStorage();
    cargarProductos();
    cargarClientes();
  }, []);

  // Refresh clients and products when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      cargarClientes();
      cargarProductos();
    };

    window.addEventListener('focus', handleFocus);

    // Also refresh when navigating back to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        cargarClientes();
        cargarProductos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Event listener para atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F5 - Enfocar select de clientes
      if (e.key === 'F5') {
        e.preventDefault();
        if (clienteSelectRef.current) {
          clienteSelectRef.current.focus();
        }
      }
      // F8 - Enfocar primer select de productos
      else if (e.key === 'F8') {
        e.preventDefault();
        if (primerProductoSelectRef.current) {
          primerProductoSelectRef.current.focus();
        }
      }
      // F10 - Registrar venta
      else if (e.key === 'F10') {
        e.preventDefault();
        if (formRef.current && !loading) {
          // Disparar el evento submit del formulario
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          formRef.current.dispatchEvent(submitEvent);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading]);

  const cargarClientes = () => {
    console.log('=== CARGANDO CLIENTES PARA VENTA ===');

    // Usar la misma lógica que ListarClientes.js para obtener TODOS los clientes
    const getMockClientes = () => [
      { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '0981-123-456', direccion: 'Asunción, Paraguay' },
      { id: 2, nombre: 'María García', email: 'maria@email.com', telefono: '0982-234-567', direccion: 'San Lorenzo, Paraguay' },
      { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', telefono: '0983-345-678', direccion: 'Fernando de la Mora, Paraguay' },
      { id: 4, nombre: 'Ana Martínez', email: 'ana@email.com', telefono: '0984-456-789', direccion: 'Lambaré, Paraguay' },
      { id: 5, nombre: 'Luis Rodríguez', email: 'luis@email.com', telefono: '0985-567-890', direccion: 'Luque, Paraguay' },
      { id: 6, nombre: 'Sofia Benítez', email: 'sofia@email.com', telefono: '0986-678-901', direccion: 'Villa Elisa, Paraguay' },
      { id: 7, nombre: 'Roberto Silva', email: 'roberto@email.com', telefono: '0987-789-012', direccion: 'Capiatá, Paraguay' },
      { id: 8, nombre: 'Laura Vega', email: 'laura@email.com', telefono: '0988-890-123', direccion: 'Ñemby, Paraguay' },
      { id: 9, nombre: 'Diego Torres', email: 'diego@email.com', telefono: '0989-901-234', direccion: 'Mariano Roque Alonso, Paraguay' },
      { id: 10, nombre: 'Carmen Flores', email: 'carmen@email.com', telefono: '0980-012-345', direccion: 'Villa Hayes, Paraguay' },
      { id: 11, nombre: 'Pablo Guerrero', email: 'pablo@email.com', telefono: '0981-123-789', direccion: 'Itauguá, Paraguay' },
      { id: 12, nombre: 'Lucía Morales', email: 'lucia@email.com', telefono: '0982-234-890', direccion: 'Guarambaré, Paraguay' },
      { id: 13, nombre: 'Fernando Castro', email: 'fernando@email.com', telefono: '0983-345-901', direccion: 'San Antonio, Paraguay' },
      { id: 14, nombre: 'Elena Ramírez', email: 'elena@email.com', telefono: '0984-456-012', direccion: 'Villeta, Paraguay' },
      { id: 15, nombre: 'Andrés Mendoza', email: 'andres@email.com', telefono: '0985-567-123', direccion: 'Areguá, Paraguay' }
    ];

    // Datos mock iniciales
    const mockData = getMockClientes();

    // Cargar clientes desde localStorage
    const clientesGuardados = JSON.parse(localStorage.getItem('clientes') || '[]');
    console.log('Clientes en localStorage:', clientesGuardados.length, clientesGuardados);

    // Combinar datos mock con clientes guardados
    const todosLosClientes = [...mockData, ...clientesGuardados];
    console.log('Total clientes para venta:', todosLosClientes.length, todosLosClientes);

    setClientesDisponibles(todosLosClientes);
  };

  const cargarProductos = () => {
    // Cargar productos desde localStorage (ya limpiados de duplicados)
    const productosExistentes = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
    console.log(`📦 Cargando productos desde localStorage: ${productosExistentes.length} productos`);

    // Si no hay productos, no inicializar mock aquí
    // Los productos mock se deben cargar desde el backend o ListarProductos
    if (productosExistentes.length === 0) {
      console.log('ℹ️ No hay productos disponibles. Por favor, agrega productos desde el módulo de productos.');
      setProductosDisponibles([]);
      return;
    }

    // Verificar duplicados una vez más antes de filtrar
    const idsUnicos = new Set();
    const duplicadosEncontrados = [];
    productosExistentes.forEach(p => {
      if (idsUnicos.has(p.id)) {
        duplicadosEncontrados.push(p.id);
      }
      idsUnicos.add(p.id);
    });

    if (duplicadosEncontrados.length > 0) {
      console.error('⚠️ DUPLICADOS ENCONTRADOS AL CARGAR:', duplicadosEncontrados);
    }

    // Filtrar solo productos activos para la venta
    const productosActivos = productosExistentes.filter(p => p.activo !== false);
    console.log(`✅ Productos activos disponibles para venta: ${productosActivos.length}`);
    console.log(`❌ Productos desactivados excluidos: ${productosExistentes.length - productosActivos.length}`);
    console.log('IDs de productos activos:', productosActivos.map(p => p.id));

    setProductosDisponibles(productosActivos);
  };

  const reducirStockProductos = async (productosVendidos) => {
    try {
      // Cargar todos los productos desde localStorage
      let todosLosProductos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');

      for (const productoVendido of productosVendidos) {
        const productoId = parseInt(productoVendido.productoId);
        const cantidadVendida = parseInt(productoVendido.cantidad);

        // Buscar el producto y reducir su stock
        const productoIndex = todosLosProductos.findIndex(p => p.id === productoId);
        if (productoIndex !== -1) {
          todosLosProductos[productoIndex].stock -= cantidadVendida;
          if (todosLosProductos[productoIndex].stock < 0) {
            todosLosProductos[productoIndex].stock = 0;
          }
        }
      }

      // Guardar todos los productos actualizados en localStorage
      localStorage.setItem('todolosproductos', JSON.stringify(todosLosProductos));

      // Actualizar el estado local con solo productos activos
      const productosActivos = todosLosProductos.filter(p => p.activo !== false);
      setProductosDisponibles(productosActivos);

      console.log('Stock actualizado correctamente');
    } catch (error) {
      console.error('Error al reducir stock:', error);
      throw new Error('Error al actualizar el stock de productos');
    }
  };

  const verificarStockBajo = (productosVendidos) => {
    const productosConStockBajo = [];

    productosVendidos.forEach(productoVendido => {
      const productoActual = productosDisponibles.find(p => p.id === parseInt(productoVendido.productoId));
      if (productoActual) {
        const nuevoStock = productoActual.stock - parseInt(productoVendido.cantidad);
        if (nuevoStock <= 5 && nuevoStock > 0) {
          productosConStockBajo.push({
            nombre: productoActual.nombre,
            codigo: productoActual.codigo,
            stock: nuevoStock
          });
        } else if (nuevoStock <= 0) {
          productosConStockBajo.push({
            nombre: productoActual.nombre,
            codigo: productoActual.codigo,
            stock: 0,
            agotado: true
          });
        }
      }
    });

    if (productosConStockBajo.length > 0) {
      let mensaje = 'AVISOS DE STOCK:\n\n';

      const agotados = productosConStockBajo.filter(p => p.agotado);
      const stockBajo = productosConStockBajo.filter(p => !p.agotado);

      if (agotados.length > 0) {
        mensaje += '🚨 PRODUCTOS AGOTADOS:\n';
        agotados.forEach(producto => {
          mensaje += `• ${producto.codigo} - ${producto.nombre}\n`;
        });
        mensaje += '\n';
      }

      if (stockBajo.length > 0) {
        mensaje += '⚠️ STOCK BAJO (≤5 unidades):\n';
        stockBajo.forEach(producto => {
          mensaje += `• ${producto.codigo} - ${producto.nombre} (Stock: ${producto.stock})\n`;
        });
      }

      alert(mensaje);
    }
  };

  const agregarProducto = () => {
    setVenta({
      ...venta,
      productos: [...venta.productos, { productoId: '', nombre: '', cantidad: 1, precio: 0 }]
    });
  };

  const removerProducto = (index) => {
    const nuevosProductos = venta.productos.filter((_, i) => i !== index);
    setVenta({
      ...venta,
      productos: nuevosProductos
    });
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...venta.productos];

    if (campo === 'productoId') {
      // Si se selecciona un producto, actualizar nombre, precio y costo automáticamente
      const productoSeleccionado = productosDisponibles.find(p => p.id === parseInt(valor));
      if (productoSeleccionado) {
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          productoId: valor,
          nombre: productoSeleccionado.nombre,
          precio: productoSeleccionado.precio,
          costo: productoSeleccionado.costo || 0
        };

        // Si este es el último producto y tiene datos válidos, agregar un nuevo campo automáticamente
        if (index === venta.productos.length - 1 && valor !== '') {
          nuevosProductos.push({ productoId: '', nombre: '', cantidad: 1, precio: 0, costo: 0 });
        }
      } else {
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          productoId: '',
          nombre: '',
          precio: 0
        };
      }
    } else {
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        [campo]: valor
      };
    }

    setVenta({
      ...venta,
      productos: nuevosProductos
    });
  };

  const calcularTotal = () => {
    return venta.productos.reduce((total, producto) => {
      return total + (parseFloat(producto.cantidad) || 0) * (parseFloat(producto.precio) || 0);
    }, 0);
  };

  const handleChange = (e) => {
    setVenta({
      ...venta,
      [e.target.name]: e.target.value
    });
  };

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const clienteSeleccionado = clientesDisponibles.find(c => c.id === parseInt(clienteId));

    if (clienteSeleccionado) {
      setVenta({
        ...venta,
        clienteId: clienteId,
        clienteNombre: clienteSeleccionado.nombre,
        clienteEmail: clienteSeleccionado.email || '',
        clienteTelefono: clienteSeleccionado.telefono || '',
        clienteDireccion: clienteSeleccionado.direccion || ''
      });
    } else {
      setVenta({
        ...venta,
        clienteId: '',
        clienteNombre: '',
        clienteEmail: '',
        clienteTelefono: '',
        clienteDireccion: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!venta.clienteId || !venta.clienteNombre.trim()) {
        alert('Por favor selecciona un cliente');
        setLoading(false);
        return;
      }

      // Validate products
      const productosValidos = venta.productos.filter(p =>
        p.productoId && p.nombre.trim() && p.cantidad > 0 && p.precio > 0
      );

      if (productosValidos.length === 0) {
        alert('Por favor agrega al menos un producto válido');
        setLoading(false);
        return;
      }

      // Validate stock availability
      for (const producto of productosValidos) {
        const productoInfo = productosDisponibles.find(p => p.id === parseInt(producto.productoId));
        if (productoInfo && parseInt(producto.cantidad) > productoInfo.stock) {
          alert(`No hay suficiente stock para ${productoInfo.nombre}. Stock disponible: ${productoInfo.stock}`);
          setLoading(false);
          return;
        }
      }

      // Prepare data for PDF
      const pdfData = {
        id: Date.now(),
        fecha: venta.fecha,
        cliente: {
          nombre: venta.clienteNombre,
          email: venta.clienteEmail,
          telefono: venta.clienteTelefono,
          direccion: venta.clienteDireccion
        },
        productos: productosValidos.map(producto => ({
          nombre: producto.nombre,
          cantidad: parseInt(producto.cantidad),
          precio: parseFloat(producto.precio),
          costo: parseFloat(producto.costo) || 0,
          subtotal: parseInt(producto.cantidad) * parseFloat(producto.precio)
        })),
        total: calcularTotal()
      };

      console.log('Generating PDF with data:', pdfData);

      // Reducir stock de productos vendidos
      await reducirStockProductos(productosValidos);

      // Generate PDF
      generateAndDownloadInvoice(pdfData);

      // Guardar venta en localStorage para el historial
      const ventaParaGuardar = {
        id: pdfData.id,
        numero: `001-001-${String(pdfData.id).padStart(6, '0')}`,
        tipo: 'venta',
        fecha: pdfData.fecha,
        cliente: pdfData.cliente.nombre,
        clienteCompleto: pdfData.cliente,
        monto: pdfData.total,
        estado: 'pagado',
        productos: pdfData.productos
      };

      // Obtener ventas existentes y agregar la nueva
      const ventasExistentes = JSON.parse(localStorage.getItem('comprobantes') || '[]');
      ventasExistentes.push(ventaParaGuardar);
      localStorage.setItem('comprobantes', JSON.stringify(ventasExistentes));

      // Verificar stock bajo después de la venta
      verificarStockBajo(productosValidos);

      alert('Venta registrada exitosamente');

      // Resetear aviso de stock para que se muestre en la próxima visita a ListarProductos
      sessionStorage.removeItem('avisoStockMostrado');

      // Recargar productos para actualizar el stock en el dropdown
      cargarProductos();

      // Reset form
      setVenta({
        clienteId: '',
        clienteNombre: '',
        clienteEmail: '',
        clienteTelefono: '',
        clienteDireccion: '',
        fecha: new Date().toISOString().split('T')[0],
        productos: [{ productoId: '', nombre: '', cantidad: 1, precio: 0, costo: 0 }]
      });

    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert(`Error al registrar la venta: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="nuevo-comprobante-header">
        <h1>Nueva Venta</h1>
        <p>Completa los datos para generar una venta y su comprobante PDF</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="comprobante-form" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label>Cliente (F5):</label>
            <select
              ref={clienteSelectRef}
              name="clienteId"
              value={venta.clienteId}
              onChange={handleClienteChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Seleccionar cliente...</option>
              {clientesDisponibles.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} - {cliente.email || 'Sin email'}
                </option>
              ))}
            </select>
            {venta.clienteNombre && (
              <div style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#666',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <strong>{venta.clienteNombre}</strong><br/>
                {venta.clienteEmail && <span>📧 {venta.clienteEmail}<br/></span>}
                {venta.clienteTelefono && <span>📱 {venta.clienteTelefono}<br/></span>}
                {venta.clienteDireccion && <span>📍 {venta.clienteDireccion}</span>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Fecha:</label>
            <input
              type="date"
              name="fecha"
              value={venta.fecha}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        <div className="productos-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Productos (F8):</h3>
            <p style={{ fontSize: '14px', color: '#666', margin: 0, fontStyle: 'italic' }}>
              Los campos se agregan automáticamente al seleccionar productos
            </p>
          </div>

          {/* Headers de la tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '3fr 80px 150px 150px 50px',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '13px',
            color: '#666'
          }}>
            <div>Producto</div>
            <div style={{ textAlign: 'center' }}>Cant.</div>
            <div style={{ textAlign: 'center' }}>Precio Unit.</div>
            <div style={{ textAlign: 'center' }}>Subtotal</div>
            <div style={{ textAlign: 'center' }}>Acc.</div>
          </div>

          {venta.productos.map((producto, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '3fr 80px 150px 150px 50px',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '10px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <select
                ref={index === 0 ? primerProductoSelectRef : null}
                value={producto.productoId}
                onChange={(e) => actualizarProducto(index, 'productoId', e.target.value)}
                style={{
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  fontSize: '13px',
                  width: '100%'
                }}
              >
                <option value="">Seleccionar producto...</option>
                {productosDisponibles.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.codigo} - {prod.nombre} (Stock: {prod.stock}) - {formatCurrency(prod.precio)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Cant."
                min="1"
                max={producto.productoId ? productosDisponibles.find(p => p.id === parseInt(producto.productoId))?.stock || 999 : 999}
                value={producto.cantidad}
                onChange={(e) => {
                  const maxStock = producto.productoId ? productosDisponibles.find(p => p.id === parseInt(producto.productoId))?.stock || 999 : 999;
                  const cantidad = Math.min(parseInt(e.target.value) || 1, maxStock);
                  actualizarProducto(index, 'cantidad', cantidad);
                }}
                style={{
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '13px',
                  textAlign: 'center'
                }}
                title={producto.productoId ? `Stock disponible: ${productosDisponibles.find(p => p.id === parseInt(producto.productoId))?.stock || 0}` : ''}
              />

              <input
                type="number"
                placeholder="Precio ₲"
                min="0"
                step="1"
                value={producto.precio}
                readOnly
                style={{
                  padding: '6px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  width: '100%',
                  fontSize: '13px',
                  textAlign: 'right'
                }}
              />

              <div style={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#1565c0',
                fontSize: '12px',
                padding: '6px 2px'
              }}>
                {formatCurrency((producto.cantidad || 0) * (producto.precio || 0))}
              </div>

              {venta.productos.length > 1 && index !== venta.productos.length - 1 && (
                <button
                  type="button"
                  onClick={() => removerProducto(index)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    width: '100%',
                    minWidth: '24px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #2196f3',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1565c0', margin: 0 }}>
            TOTAL: {formatCurrency(calcularTotal())}
          </h3>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '20px',
          justifyContent: 'flex-end'
        }}>
          <button
            type="button"
            onClick={() => {
              setVenta({
                clienteId: '',
                clienteNombre: '',
                clienteEmail: '',
                clienteTelefono: '',
                clienteDireccion: '',
                fecha: new Date().toISOString().split('T')[0],
                productos: [{ productoId: '', nombre: '', cantidad: 1, precio: 0, costo: 0 }]
              });
            }}
            style={{
              padding: '15px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Limpiar Formulario
          </button>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px 30px',
              backgroundColor: loading ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generando...' : 'Registrar Venta y Generar PDF (F10)'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NuevaVenta;
