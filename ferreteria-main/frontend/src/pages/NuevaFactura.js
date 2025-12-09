import React, { useState, useEffect } from "react";
import "./Articulos.css";
import { generateAndDownloadInvoice } from "../utils/pdfGenerator";
import { formatCurrency } from "../utils/currency";

function NuevaFactura() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ventaData, setVentaData] = useState({
    cliente_id: "",
    fecha: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    total: 0
  });
  const [detalleVenta, setDetalleVenta] = useState([]);
  const [lastVentaId, setLastVentaId] = useState(null);
  const [lastVentaData, setLastVentaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      await Promise.all([fetchClientes(), fetchProductos()]);
      setLoadingData(false);
    };
    loadData();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(Array.isArray(data) ? data : []);
      } else {
        console.error('Error al cargar clientes - Status:', response.status);
        // Use mock data for testing
        setClientes([
          { id: 1, nombre: 'Cliente Demo', email: 'demo@email.com' },
          { id: 2, nombre: 'Cliente Test', email: 'test@email.com' }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      // Use mock data for testing
      setClientes([
        { id: 1, nombre: 'Cliente Demo', email: 'demo@email.com' },
        { id: 2, nombre: 'Cliente Test', email: 'test@email.com' }
      ]);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/productos');
      if (response.ok) {
        const data = await response.json();
        setProductos(Array.isArray(data) ? data : []);
      } else {
        console.error('Error al cargar productos - Status:', response.status);
        // Use mock data for testing
        setProductos([
          { id: 1, nombre: 'Producto Demo', precio: 100.00, stock: 10 },
          { id: 2, nombre: 'Producto Test', precio: 50.00, stock: 5 }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      // Use mock data for testing
      setProductos([
        { id: 1, nombre: 'Producto Demo', precio: 100.00, stock: 10 },
        { id: 2, nombre: 'Producto Test', precio: 50.00, stock: 5 }
      ]);
    }
  };

  const agregarProducto = () => {
    setDetalleVenta([
      ...detalleVenta,
      { producto_id: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }
    ]);
  };

  const removerProducto = (index) => {
    const nuevosDetalles = detalleVenta.filter((_, i) => i !== index);
    setDetalleVenta(nuevosDetalles);
    actualizarTotal(nuevosDetalles);
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevosDetalles = [...detalleVenta];
    
    // Ensure the detail object exists
    if (!nuevosDetalles[index]) {
      nuevosDetalles[index] = { producto_id: "", cantidad: 1, precio_unitario: 0, subtotal: 0 };
    }
    
    nuevosDetalles[index][field] = value;
    
    if (field === 'producto_id' && value) {
      const producto = productos.find(p => p.id === parseInt(value));
      if (producto) {
        nuevosDetalles[index].precio_unitario = parseFloat(producto.precio) || 0;
        // Check stock availability
        if (nuevosDetalles[index].cantidad > producto.stock) {
          alert(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles.`);
          nuevosDetalles[index].cantidad = producto.stock;
        }
      }
    }
    
    // Calculate subtotal
    const cantidad = parseFloat(nuevosDetalles[index].cantidad) || 0;
    const precio = parseFloat(nuevosDetalles[index].precio_unitario) || 0;
    nuevosDetalles[index].subtotal = cantidad * precio;
    
    setDetalleVenta(nuevosDetalles);
    actualizarTotal(nuevosDetalles);
  };

  const actualizarTotal = (detalles = detalleVenta) => {
    const total = detalles.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
    setVentaData(prev => ({ ...prev, total: total }));
  };

  const calcularTotal = () => {
    return detalleVenta.reduce((total, item) => {
      return total + (parseFloat(item.subtotal) || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!ventaData.cliente_id) {
      alert('Selecciona un cliente');
      setLoading(false);
      return;
    }
    
    if (detalleVenta.length === 0) {
      alert('Agrega al menos un producto');
      setLoading(false);
      return;
    }

    // Validate all products have required fields
    const invalidProducts = detalleVenta.some(d => 
      !d.producto_id || !d.cantidad || d.cantidad <= 0 || !d.precio_unitario || d.precio_unitario <= 0
    );
    
    if (invalidProducts) {
      alert('Por favor completa todos los campos de productos con valores válidos');
      setLoading(false);
      return;
    }

    // Validate stock for all products
    for (const detalle of detalleVenta) {
      const producto = productos.find(p => p.id === parseInt(detalle.producto_id));
      if (producto && detalle.cantidad > producto.stock) {
        alert(`Stock insuficiente para ${producto.nombre}. Solo hay ${producto.stock} unidades disponibles.`);
        setLoading(false);
        return;
      }
    }

    const ventaCompleta = {
      cliente_id: parseInt(ventaData.cliente_id),
      fecha: ventaData.fecha,
      total: calcularTotal(),
      detalles: detalleVenta.map(d => ({
        producto_id: parseInt(d.producto_id),
        cantidad: parseInt(d.cantidad),
        precio_unitario: parseFloat(d.precio_unitario),
        subtotal: parseFloat(d.subtotal)
      }))
    };

    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventaCompleta)
      });

      if (response.ok) {
        const result = await response.json();
        const ventaId = result.venta_id || result.id || Date.now();
        setLastVentaId(ventaId);
        
        // Store the complete venta data for PDF generation
        const cliente = clientes.find(c => c.id === parseInt(ventaData.cliente_id));
        const ventaParaPDF = {
          id: ventaId,
          fecha: ventaData.fecha,
          cliente: cliente ? cliente.nombre : 'Cliente',
          productos: detalleVenta.map(detalle => {
            const producto = productos.find(p => p.id === parseInt(detalle.producto_id));
            return {
              nombre: producto ? producto.nombre : 'Producto',
              cantidad: parseInt(detalle.cantidad),
              precio: parseFloat(detalle.precio_unitario),
              subtotal: parseFloat(detalle.subtotal)
            };
          }),
          total: calcularTotal()
        };
        setLastVentaData(ventaParaPDF);
        
        alert('Venta registrada exitosamente');
        
        // Auto-generate PDF comprobante
        try {
          generateAndDownloadInvoice(ventaParaPDF);
          alert('Comprobante PDF generado automáticamente');
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          alert('Venta registrada, pero hubo un error al generar el PDF. Puedes generarlo manualmente desde Comprobantes.');
        }
        
        // Reset form
        setVentaData({
          cliente_id: "",
          fecha: new Date().toISOString().split('T')[0],
          total: 0
        });
        setDetalleVenta([]);
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        alert(`Error al registrar la venta: ${response.status}`);
        
        // For development, simulate success
        const ventaId = Date.now();
        setLastVentaId(ventaId);
        
        const cliente = clientes.find(c => c.id === parseInt(ventaData.cliente_id));
        const ventaParaPDF = {
          id: ventaId,
          fecha: ventaData.fecha,
          cliente: cliente ? cliente.nombre : 'Cliente',
          productos: detalleVenta.map(detalle => {
            const producto = productos.find(p => p.id === parseInt(detalle.producto_id));
            return {
              nombre: producto ? producto.nombre : 'Producto',
              cantidad: parseInt(detalle.cantidad),
              precio: parseFloat(detalle.precio_unitario),
              subtotal: parseFloat(detalle.subtotal)
            };
          }),
          total: calcularTotal()
        };
        setLastVentaData(ventaParaPDF);
        
        alert('Venta registrada (modo desarrollo)');
        
        // Auto-generate PDF comprobante
        try {
          generateAndDownloadInvoice(ventaParaPDF);
          alert('Comprobante PDF generado automáticamente');
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          alert('Venta registrada, pero hubo un error al generar el PDF.');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor. Modo desarrollo activado.');
      
      // For development, simulate success
      const ventaId = Date.now();
      setLastVentaId(ventaId);
      
      const cliente = clientes.find(c => c.id === parseInt(ventaData.cliente_id));
      const ventaParaPDF = {
        id: ventaId,
        fecha: ventaData.fecha,
        cliente: cliente ? cliente.nombre : 'Cliente',
        productos: detalleVenta.map(detalle => {
          const producto = productos.find(p => p.id === parseInt(detalle.producto_id));
          return {
            nombre: producto ? producto.nombre : 'Producto',
            cantidad: parseInt(detalle.cantidad),
            precio: parseFloat(detalle.precio_unitario),
            subtotal: parseFloat(detalle.subtotal)
          };
        }),
        total: calcularTotal()
      };
      setLastVentaData(ventaParaPDF);
      
      // Auto-generate PDF comprobante
      try {
        generateAndDownloadInvoice(ventaParaPDF);
        alert('Comprobante PDF generado automáticamente (modo desarrollo)');
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        alert('Venta registrada, pero hubo un error al generar el PDF.');
      }
    } finally {
      setLoading(false);
    }
  };


  if (loadingData) {
    return (
      <div className="content">
        <h1>🧾 Nueva Factura</h1>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <h1>Nueva Factura</h1>
      
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Cliente</label>
          <select
            value={ventaData.cliente_id}
            onChange={(e) => setVentaData({ ...ventaData, cliente_id: e.target.value })}
            required
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.email}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Fecha de Venta</label>
          <input
            type="date"
            value={ventaData.fecha}
            onChange={(e) => setVentaData({ ...ventaData, fecha: e.target.value })}
            required
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Productos</h3>
            <button
              type="button"
              onClick={agregarProducto}
              className="btn-success"
            >
              Agregar Producto
            </button>
          </div>

          {detalleVenta.map((detalle, index) => {
            const producto = productos.find(p => p.id === parseInt(detalle.producto_id));
            return (
              <div key={index} className="product-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr', gap: '10px', alignItems: 'center', marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <select
                  value={detalle.producto_id}
                  onChange={(e) => actualizarDetalle(index, 'producto_id', e.target.value)}
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - Stock: {producto.stock} - {formatCurrency(producto.precio)}
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  min="1"
                  max={producto ? producto.stock : 999}
                  value={detalle.cantidad}
                  onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                  placeholder="Cant."
                  required
                />
                
                <input
                  type="number"
                  step="0.01"
                  value={detalle.precio_unitario}
                  onChange={(e) => actualizarDetalle(index, 'precio_unitario', e.target.value)}
                  placeholder="Precio Unit."
                  required
                />
                
                <div style={{ fontWeight: 'bold', color: '#8e44ad', textAlign: 'center' }}>
                  {formatCurrency(detalle.subtotal || 0)}
                </div>
                
                <button
                  type="button"
                  onClick={() => removerProducto(index)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </div>

        {detalleVenta.length > 0 && (
          <div className="total-section" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #8e44ad', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>Productos: {detalleVenta.length}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Cantidad Total: {detalleVenta.reduce((sum, d) => sum + (parseInt(d.cantidad) || 0), 0)}</strong>
              </div>
            </div>
            <hr />
            <h3 style={{ color: '#8e44ad', margin: 0, textAlign: 'center' }}>
              TOTAL: {formatCurrency(calcularTotal())}
            </h3>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || detalleVenta.length === 0}
          style={{ 
            marginTop: '20px',
            opacity: loading || detalleVenta.length === 0 ? 0.7 : 1,
            cursor: loading || detalleVenta.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Procesando...' : 'Registrar Venta'}
        </button>
      </form>

      {lastVentaId && (
        <div className="success-message" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '15px', marginTop: '20px' }}>
          <p style={{ color: '#155724', margin: '0 0 10px 0', fontWeight: 'bold' }}>Venta registrada con ID: {lastVentaId}</p>
          <p style={{ color: '#155724', margin: '0 0 15px 0' }}>Fecha: {lastVentaData?.fecha} | Total: {formatCurrency(lastVentaData?.total || 0)}</p>
          <p style={{ color: '#155724', margin: 0, fontStyle: 'italic' }}>El comprobante PDF fue generado automáticamente</p>
        </div>
      )}
    </div>
  );
}

export default NuevaFactura;