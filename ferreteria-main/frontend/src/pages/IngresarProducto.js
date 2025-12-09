import React, { useState, useEffect } from "react";
import { apiService } from '../services/api';
import "./Articulos.css";

function IngresarProducto() {
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    costo: "",
    stock_inicial: "",
    categoria_id: "",
    proveedor_id: ""
  });

  // Set mock data immediately instead of async loading
  const [categorias] = useState([
    { id: 1, nombre: 'Herramientas' },
    { id: 2, nombre: 'Materiales de Construcción' },
    { id: 3, nombre: 'Pintura' },
    { id: 4, nombre: 'Electricidad' },
    { id: 5, nombre: 'Plomería' },
    { id: 6, nombre: 'Ferretería General' },
    { id: 7, nombre: 'Jardinería' },
    { id: 8, nombre: 'Seguridad' }
  ]);
  
  const [proveedores] = useState([
    { id: 1, nombre: 'Proveedor ABC', ruc: '80012345-7' },
    { id: 2, nombre: 'Distribuidora XYZ', ruc: '80023456-8' },
    { id: 3, nombre: 'Ferretería Central', ruc: '80034567-9' },
    { id: 4, nombre: 'Materiales del Sur', ruc: '80045678-0' },
    { id: 5, nombre: 'Hierros y Metales SA', ruc: '80056789-1' },
    { id: 6, nombre: 'Pinturas del Este', ruc: '80067890-2' },
    { id: 7, nombre: 'Herramientas Pro', ruc: '80078901-3' },
    { id: 8, nombre: 'Construcciones Norte', ruc: '80089012-4' }
  ]);

  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombre || !formData.nombre.trim()) {
        alert('El nombre del producto es obligatorio');
        setLoading(false);
        return;
      }

      if (!formData.precio || parseFloat(formData.precio) <= 0) {
        alert('El precio de venta es obligatorio y debe ser mayor a cero');
        setLoading(false);
        return;
      }

      if (!formData.categoria_id) {
        alert('Por favor selecciona una categoría');
        setLoading(false);
        return;
      }

      // Preparar datos para el backend
      // El código se genera automáticamente en el backend
      // El proveedor es opcional
      console.log('=== FRONTEND DEBUG ===');
      console.log('formData.proveedor_id (raw):', formData.proveedor_id, 'Tipo:', typeof formData.proveedor_id);

      // Validar y convertir proveedor_id correctamente
      let proveedorIdFinal = null;
      if (formData.proveedor_id && formData.proveedor_id !== '' && formData.proveedor_id !== '0') {
        proveedorIdFinal = parseInt(formData.proveedor_id);
      }

      const productoData = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio),
        costo: formData.costo ? parseFloat(formData.costo) : 0,
        stock_inicial: formData.stock_inicial ? parseInt(formData.stock_inicial) : 0,
        categoria_id: parseInt(formData.categoria_id),
        proveedor_id: proveedorIdFinal
      };

      console.log('Datos a enviar al backend:', productoData);
      console.log('proveedor_id procesado:', productoData.proveedor_id, 'Tipo:', typeof productoData.proveedor_id);

      // Crear producto en el backend
      const nuevoProducto = await apiService.post('/productos', productoData);
      console.log('✅ Respuesta del backend:', nuevoProducto);
      console.log('Proveedor en respuesta:', nuevoProducto.proveedor);
      console.log('Proveedor ID en respuesta:', nuevoProducto.proveedor_id);

      alert(`Producto creado exitosamente con código ${nuevoProducto.codigo}`);

      // Reset form
      setFormData({
        nombre: "",
        precio: "",
        costo: "",
        stock_inicial: "",
        categoria_id: "",
        proveedor_id: ""
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      alert(`Error al crear el producto: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="content">
      <h1>Ingresar Producto</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre del Producto</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Martillo de acero"
            required
          />
        </div>

        <div className="form-group">
          <label>Precio de Venta (₲)</label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            step="1"
            min="0"
            placeholder="150000"
            required
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Precio al que se venderá al cliente
          </small>
        </div>

        <div className="form-group">
          <label>Precio de Costo (₲)</label>
          <input
            type="number"
            name="costo"
            value={formData.costo}
            onChange={handleChange}
            step="1"
            min="0"
            placeholder="100000"
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Precio de compra al proveedor (se actualizará con las compras)
          </small>
        </div>

        <div className="form-group">
          <label>Stock Inicial</label>
          <input
            type="number"
            name="stock_inicial"
            value={formData.stock_inicial}
            onChange={handleChange}
            step="1"
            min="0"
            placeholder="0"
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Cantidad inicial de unidades disponibles
          </small>
        </div>

        <div className="form-group" style={{
          backgroundColor: '#e3f2fd',
          padding: '15px',
          borderRadius: '5px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#1565c0' }}>
            ℹ️ <strong>Nota:</strong> El código se generará automáticamente en formato PROD000001
          </p>
        </div>

        <div className="form-group">
          <label>Categoría *</label>
          <select
            name="categoria_id"
            value={formData.categoria_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Proveedor (Opcional)</label>
          <select
            name="proveedor_id"
            value={formData.proveedor_id}
            onChange={handleChange}
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}{proveedor.ruc ? ` - RUC: ${proveedor.ruc}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}

export default IngresarProducto;