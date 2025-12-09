import React, { useState, useEffect, useRef } from 'react';
import '../styles/HistorialComprobantes.css';
import { formatCurrency } from '../utils/currency';
import { generateAndDownloadInvoice } from '../utils/pdfGenerator';
import { apiService } from '../services/api';

function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para selección múltiple
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Estados para nueva venta
  const [loading, setLoading] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [ventaRegistrada, setVentaRegistrada] = useState(null); // Para almacenar datos de la venta registrada
  const [showClienteModal, setShowClienteModal] = useState(false); // Modal para selección de clientes con F5
  const [clienteSearchTerm, setClienteSearchTerm] = useState(''); // Búsqueda en modal de clientes
  const [selectedClienteIndex, setSelectedClienteIndex] = useState(0); // Índice del cliente resaltado en el modal

  // Estados para modal de productos (F8)
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [selectedProductoIndex, setSelectedProductoIndex] = useState(0);
  const [currentProductRowIndex, setCurrentProductRowIndex] = useState(0); // Índice de la fila de producto actual

  // Ref para el contenedor de la lista de clientes
  const clienteListRef = useRef(null);
  const selectedClienteRef = useRef(null);

  // Ref para el contenedor de la lista de productos
  const productoListRef = useRef(null);
  const selectedProductoRef = useRef(null);
  const [venta, setVenta] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    clienteDireccion: '',
    fecha: new Date().toISOString().split('T')[0],
    productos: [{ productoId: '', nombre: '', cantidad: 1, precio: 0 }]
  });

  useEffect(() => {
    cargarVentas();
    cargarClientes();
    cargarProductos();
  }, []);

  // Event listener para tecla F5, F8, F10, Delete, ESC, y navegación con flechas
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F5 - Abrir modal de clientes
      if (e.key === 'F5') {
        e.preventDefault();
        setShowClienteModal(true);
        setClienteSearchTerm('');
        setSelectedClienteIndex(0);
      }
      // F8 - Abrir modal de productos
      else if (e.key === 'F8') {
        e.preventDefault();
        setShowProductoModal(true);
        setProductoSearchTerm('');
        setSelectedProductoIndex(0);
      }
      // F10 - Registrar venta
      else if (e.key === 'F10') {
        e.preventDefault();
        if (!loading) {
          // Crear un evento de submit y dispararlo
          const form = document.querySelector('form.venta-form');
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
          }
        }
      }
      // Delete - Borrar fila de producto actual (si no está en ningún modal)
      else if (e.key === 'Delete' && !showClienteModal && !showProductoModal) {
        e.preventDefault();
        if (venta.productos.length > 1) {
          const nuevosProductos = venta.productos.filter((_, i) => i !== currentProductRowIndex);
          setVenta({
            ...venta,
            productos: nuevosProductos
          });
          // Ajustar índice si es necesario
          if (currentProductRowIndex >= nuevosProductos.length) {
            setCurrentProductRowIndex(Math.max(0, nuevosProductos.length - 1));
          }
        }
      }
      // Modal de clientes abierto
      else if (showClienteModal) {
        const clientesFiltrados = clientesDisponibles.filter(cliente =>
          cliente.nombre.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
          (cliente.email && cliente.email.toLowerCase().includes(clienteSearchTerm.toLowerCase()))
        );

        if (e.key === 'Escape') {
          setShowClienteModal(false);
          setClienteSearchTerm('');
          setSelectedClienteIndex(0);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedClienteIndex(prev =>
            prev < clientesFiltrados.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedClienteIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && clientesFiltrados.length > 0) {
          e.preventDefault();
          const clienteSeleccionado = clientesFiltrados[selectedClienteIndex];
          if (clienteSeleccionado) {
            handleClienteChange({ target: { value: clienteSeleccionado.id } });
            setShowClienteModal(false);
            setClienteSearchTerm('');
            setSelectedClienteIndex(0);
          }
        }
      }
      // Modal de productos abierto
      else if (showProductoModal) {
        const productosFiltrados = productosDisponibles.filter(producto =>
          producto.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
          producto.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
        );

        if (e.key === 'Escape') {
          setShowProductoModal(false);
          setProductoSearchTerm('');
          setSelectedProductoIndex(0);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedProductoIndex(prev =>
            prev < productosFiltrados.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedProductoIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && productosFiltrados.length > 0) {
          e.preventDefault();
          const productoSeleccionado = productosFiltrados[selectedProductoIndex];
          if (productoSeleccionado) {
            actualizarProducto(currentProductRowIndex, 'productoId', productoSeleccionado.id.toString());
            // Mover el cursor a la siguiente fila después de seleccionar
            setCurrentProductRowIndex(prev => prev + 1);
            setShowProductoModal(false);
            setProductoSearchTerm('');
            setSelectedProductoIndex(0);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showClienteModal, showProductoModal, clienteSearchTerm, productoSearchTerm, selectedClienteIndex, selectedProductoIndex, clientesDisponibles, productosDisponibles, currentProductRowIndex, venta.productos]);

  // Auto-scroll para mantener el elemento seleccionado visible (clientes)
  useEffect(() => {
    if (showClienteModal && selectedClienteRef.current) {
      selectedClienteRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedClienteIndex, showClienteModal]);

  // Auto-scroll para mantener el elemento seleccionado visible (productos)
  useEffect(() => {
    if (showProductoModal && selectedProductoRef.current) {
      selectedProductoRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedProductoIndex, showProductoModal]);

  // Resetear índice cuando cambia la búsqueda (clientes)
  useEffect(() => {
    if (showClienteModal) {
      setSelectedClienteIndex(0);
    }
  }, [clienteSearchTerm]);

  // Resetear índice cuando cambia la búsqueda (productos)
  useEffect(() => {
    if (showProductoModal) {
      setSelectedProductoIndex(0);
    }
  }, [productoSearchTerm]);

  // Cargar ventas desde localStorage (o backend si está disponible)
  const cargarVentas = async () => {
    try {
      setLoading(true);

      // Cargar desde localStorage
      const ventasGuardadas = JSON.parse(localStorage.getItem('comprobantes') || '[]');

      // Si no hay ventas guardadas, mostrar ejemplos
      if (ventasGuardadas.length === 0) {
        const ejemplos = [
          {
            id: 1,
            numero: '001-001-000001',
            tipo: 'venta',
            fecha: '2023-12-15',
            cliente: 'Juan Pérez',
            monto: 187500,
            estado: 'pagado'
          },
          {
            id: 2,
            numero: '001-001-000002',
            tipo: 'venta',
            fecha: '2023-12-14',
            cliente: 'María García',
            monto: 133575,
            estado: 'pendiente'
          },
          {
            id: 3,
            numero: '001-001-000003',
            tipo: 'venta',
            fecha: '2023-12-13',
            cliente: 'Carlos López',
            monto: 322613,
            estado: 'pagado'
          }
        ];
        setVentas(ejemplos);
      } else {
        // Ordenar ventas por fecha/id descendente (más recientes primero)
        const ventasOrdenadas = ventasGuardadas.sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha) || b.id - a.id;
        });
        setVentas(ventasOrdenadas);
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      console.log('=== CARGANDO CLIENTES (BACKEND + LOCALSTORAGE) ===');
      const token = localStorage.getItem('token');
      console.log('Token disponible para clientes:', !!token);

      let clientesBackend = [];
      let clientesLocal = [];

      // Intentar cargar desde backend si hay token
      if (token) {
        try {
          console.log('Cargando clientes desde backend...');
          const backendData = await apiService.get('/clientes');
          clientesBackend = backendData.map(c => ({
            id: c.id,
            nombre: c.nombre,
            email: c.email,
            telefono: c.telefono,
            direccion: c.direccion
          }));
          console.log('✅ Clientes del backend:', clientesBackend.length);
        } catch (error) {
          console.log('❌ Error al cargar desde backend:', error.message);
        }
      }

      // Cargar clientes del usuario desde localStorage
      const todosLosClientes = JSON.parse(localStorage.getItem('clientes') || '[]');
      if (todosLosClientes.length > 0) {
        clientesLocal = todosLosClientes.map(c => ({
          id: c.id,
          nombre: c.nombre,
          email: c.email || '',
          telefono: c.telefono || '',
          direccion: c.direccion || ''
        }));
        console.log('✅ Clientes de localStorage:', clientesLocal.length);
      }

      // Combinar clientes del backend con localStorage
      let clientesCombinados = [];

      if (token && clientesBackend.length > 0) {
        // Mezclar ambas fuentes
        clientesCombinados = [...clientesBackend, ...clientesLocal];
        console.log('🎯 Usando clientes del backend + localStorage:', clientesCombinados);
      } else {
        // Sin token, usar localStorage como fallback
        clientesCombinados = [...clientesLocal];
        console.log('⚠️ Sin token - usando clientes locales:', clientesCombinados);
      }

      // Si no hay clientes de ninguna fuente, usar fallback
      if (clientesCombinados.length === 0) {
        console.log('No hay clientes, usando fallback');
        const fallbackClientes = [
          { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '0981-123-456', direccion: 'Asunción, Paraguay' },
          { id: 2, nombre: 'María García', email: 'maria@email.com', telefono: '0982-234-567', direccion: 'San Lorenzo, Paraguay' },
          { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', telefono: '0983-345-678', direccion: 'Fernando de la Mora, Paraguay' }
        ];
        setClientesDisponibles(fallbackClientes);
      } else {
        console.log(`🎯 Total clientes disponibles: ${clientesCombinados.length}`);
        setClientesDisponibles(clientesCombinados);
      }

    } catch (error) {
      console.error('Error general al cargar clientes:', error);
      // Fallback final
      const fallbackClientes = [
        { id: 1, nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '0981-123-456', direccion: 'Asunción, Paraguay' },
        { id: 2, nombre: 'María García', email: 'maria@email.com', telefono: '0982-234-567', direccion: 'San Lorenzo, Paraguay' },
        { id: 3, nombre: 'Carlos López', email: 'carlos@email.com', telefono: '0983-345-678', direccion: 'Fernando de la Mora, Paraguay' }
      ];
      setClientesDisponibles(fallbackClientes);
    }
  };

  const cargarProductos = async () => {
    try {
      console.log('=== CARGANDO PRODUCTOS (BACKEND + LOCALSTORAGE) ===');
      const token = localStorage.getItem('token');
      console.log('Token disponible para productos:', !!token);

      let productosBackend = [];
      let productosLocal = [];

      // Intentar cargar desde backend si hay token
      if (token) {
        try {
          console.log('Cargando productos desde backend...');
          const backendData = await apiService.get('/productos');
          productosBackend = backendData.map(p => ({
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            precio: p.precio,
            stock: p.stock,
            categoria: p.categoria,
            proveedor: p.proveedor
          }));
          console.log('✅ Productos del backend:', productosBackend.length);
        } catch (error) {
          console.log('❌ Error al cargar desde backend:', error.message);
        }
      }

      // Cargar productos del usuario desde localStorage
      const todosLosProductos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
      if (todosLosProductos.length > 0) {
        productosLocal = todosLosProductos.map(p => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precio: p.precio,
          stock: p.stock,
          categoria: p.categoria,
          proveedor: p.proveedor
        }));
        console.log('✅ Productos de localStorage:', productosLocal.length);
      }

      // Combinar productos
      let productosCombinados = [];

      if (token && productosBackend.length > 0) {
        productosCombinados = [...productosBackend, ...productosLocal];
        console.log('🎯 Usando productos del backend + localStorage:', productosCombinados);
      } else {
        productosCombinados = [...productosLocal];
        console.log('⚠️ Sin token - usando productos locales:', productosCombinados);
      }

      // Si no hay productos de ninguna fuente, usar fallback
      if (productosCombinados.length === 0) {
        console.log('No hay productos, usando fallback');
        const fallbackProductos = [
          { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A' },
          { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B' },
          { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C' }
        ];
        setProductosDisponibles(fallbackProductos);
      } else {
        console.log(`🎯 Total productos disponibles: ${productosCombinados.length}`);
        setProductosDisponibles(productosCombinados);
      }

    } catch (error) {
      console.error('Error general al cargar productos:', error);
      // Fallback final
      const fallbackProductos = [
        { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A' },
        { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B' },
        { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C' }
      ];
      setProductosDisponibles(fallbackProductos);
    }
  };

  useEffect(() => {
    let filtered = ventas.filter(venta => {
      // Filtro por mes
      if (filtroMes !== 'todos') {
        const fechaVenta = new Date(venta.fecha);
        const mesVenta = fechaVenta.getFullYear() + '-' + String(fechaVenta.getMonth() + 1).padStart(2, '0');
        if (mesVenta !== filtroMes) return false;
      }

      // Filtro por búsqueda
      if (searchTerm) {
        return (
          venta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venta.fecha.includes(searchTerm)
        );
      }

      return true;
    });

    setFilteredVentas(filtered);
    setCurrentPage(1);
  }, [ventas, filtroMes, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVentas = filteredVentas.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Función para obtener meses únicos de las ventas
  const obtenerMesesDisponibles = () => {
    const meses = new Set();
    ventas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const mesAño = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
      meses.add(mesAño);
    });

    return Array.from(meses).sort().reverse(); // Ordenar descendente (más recientes primero)
  };

  // Función para formatear el mes para mostrar
  const formatearMes = (mesAño) => {
    const [año, mes] = mesAño.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${meses[parseInt(mes) - 1]} ${año}`;
  };

  // Calcular total del mes seleccionado
  const calcularTotalMes = () => {
    return filteredVentas.reduce((total, venta) => total + venta.monto, 0);
  };

  // Generar informe PDF (mensual o general)
  const generarInformePDF = () => {
    try {
      // Crear contenido del informe
      const fechaActual = new Date().toLocaleDateString();
      const totalVentas = filteredVentas.length;
      const montoTotal = calcularTotalMes();

      let titulo, tipoInforme;
      if (filtroMes === 'todos') {
        titulo = 'INFORME GENERAL - TODAS LAS VENTAS';
        tipoInforme = 'General';
      } else {
        const mesSeleccionado = formatearMes(filtroMes);
        titulo = `INFORME MENSUAL - ${mesSeleccionado.toUpperCase()}`;
        tipoInforme = formatearMes(filtroMes);
      }

      // Preparar datos para el PDF
      const informeData = {
        titulo,
        fecha: fechaActual,
        tipoInforme,
        resumen: {
          totalVentas,
          montoTotal: formatCurrency(montoTotal)
        },
        ventas: filteredVentas.map(venta => ({
          numero: venta.numero,
          fecha: venta.fecha,
          cliente: venta.cliente,
          monto: formatCurrency(venta.monto)
        }))
      };

      // Generar y descargar PDF del informe
      generarPDFInforme(informeData);

    } catch (error) {
      console.error('Error al generar informe:', error);
      alert('Error al generar el informe mensual');
    }
  };

  // Función para generar PDF del informe
  const generarPDFInforme = (data) => {
    // Crear ventana de impresión con contenido del informe
    const ventanaImpresion = window.open('', '_blank');

    const contenidoHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.titulo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2196f3;
          }
          .titulo {
            color: #1565c0;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .fecha {
            color: #666;
            font-size: 14px;
          }
          .resumen {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .resumen h3 {
            color: #1565c0;
            margin-top: 0;
          }
          .tabla {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .tabla th, .tabla td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .tabla th {
            background-color: #2196f3;
            color: white;
            font-weight: bold;
          }
          .tabla tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .total {
            text-align: right;
            font-weight: bold;
            background-color: #e3f2fd;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="titulo">${data.titulo}</h1>
          <p class="fecha">Generado el: ${data.fecha}</p>
        </div>

        <div class="resumen">
          <h3>Resumen del Período: ${data.tipoInforme}</h3>
          <p><strong>Total de ventas:</strong> ${data.resumen.totalVentas}</p>
          <p><strong>Monto total facturado:</strong> ${data.resumen.montoTotal}</p>
        </div>

        <h3>Detalle de Ventas</h3>
        <table class="tabla">
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            ${data.ventas.map(venta => `
              <tr>
                <td>${venta.numero}</td>
                <td>${venta.fecha}</td>
                <td>${venta.cliente}</td>
                <td style="text-align: right;">${venta.monto}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td colspan="3"><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${data.resumen.montoTotal}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="
            background-color: #2196f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
          ">Imprimir / Guardar PDF</button>
          <button onclick="window.close()" style="
            background-color: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">Cerrar</button>
        </div>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(contenidoHTML);
    ventanaImpresion.document.close();

    // Auto-abrir diálogo de impresión después de un pequeño delay
    setTimeout(() => {
      ventanaImpresion.print();
    }, 500);
  };

  const handleGeneratePDF = (venta) => {
    try {
      // Convert venta data to invoice format
      const ventaData = {
        id: venta.id,
        fecha: venta.fecha,
        cliente: venta.clienteCompleto || {
          nombre: venta.cliente,
          email: '',
          telefono: '',
          direccion: ''
        },
        productos: venta.productos || [
          {
            nombre: `Venta ${venta.tipo || 'comprobante'}`,
            cantidad: 1,
            precio: venta.monto
          }
        ],
        total: venta.monto
      };

      // Generate and download PDF
      generateAndDownloadInvoice(ventaData);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el comprobante de venta');
    }
  };

  const handleEdit = (venta) => {
    alert(`Editar venta: ${venta.numero}`);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (venta) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la venta ${venta.numero}?`)) {
      try {
        // Eliminar venta del localStorage
        const ventasActuales = JSON.parse(localStorage.getItem('comprobantes') || '[]');
        const ventasActualizadas = ventasActuales.filter(v => v.id !== venta.id);
        localStorage.setItem('comprobantes', JSON.stringify(ventasActualizadas));

        // Recargar datos
        await cargarVentas();

        alert(`Venta ${venta.numero} eliminada exitosamente`);
      } catch (error) {
        console.error('Error al eliminar venta:', error);
        alert('Error al eliminar la venta. Revisa la consola para más detalles.');
      }
    }
  };

  // Funciones para selección múltiple
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedVentas([]);
  };

  const toggleSelectVenta = (ventaId) => {
    setSelectedVentas(prev =>
      prev.includes(ventaId)
        ? prev.filter(id => id !== ventaId)
        : [...prev, ventaId]
    );
  };

  const selectAllVentas = () => {
    const currentPageIds = currentVentas.map(v => v.id);
    const allCurrentSelected = currentPageIds.every(id => selectedVentas.includes(id));

    if (allCurrentSelected) {
      // Deseleccionar todos los de la página actual
      setSelectedVentas(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Seleccionar todos los de la página actual (mantener los de otras páginas)
      setSelectedVentas(prev => {
        const newSelection = [...prev];
        currentPageIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const eliminarVentasSeleccionadas = async () => {
    if (selectedVentas.length === 0) {
      alert('No hay ventas seleccionadas para eliminar');
      return;
    }

    const mensaje = `¿Estás seguro de que deseas eliminar ${selectedVentas.length} venta${selectedVentas.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`;

    if (window.confirm(mensaje)) {
      try {
        // Eliminar del localStorage
        const ventasActuales = JSON.parse(localStorage.getItem('comprobantes') || '[]');
        const ventasActualizadas = ventasActuales.filter(v => !selectedVentas.includes(v.id));
        localStorage.setItem('comprobantes', JSON.stringify(ventasActualizadas));

        alert(`${selectedVentas.length} ventas eliminadas exitosamente`);

        // Reload data
        await cargarVentas();
        setSelectedVentas([]);
        setIsSelectMode(false);

      } catch (error) {
        console.error('Error al eliminar ventas:', error);
        alert(`Error al eliminar ventas: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  // Reducir stock de productos vendidos
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

      // Actualizar el estado local
      setProductosDisponibles(todosLosProductos);

      console.log('Stock actualizado correctamente');
    } catch (error) {
      console.error('Error al reducir stock:', error);
      throw new Error('Error al actualizar el stock de productos');
    }
  };

  // Funciones para nueva venta
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
    const clienteSeleccionado = clientesDisponibles.find(c => c.id == clienteId);

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

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...venta.productos];

    if (campo === 'productoId') {
      // Si se selecciona un producto, actualizar nombre y precio automáticamente
      const productoSeleccionado = productosDisponibles.find(p => p.id === parseInt(valor));
      if (productoSeleccionado) {
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          productoId: valor,
          nombre: productoSeleccionado.nombre,
          precio: productoSeleccionado.precio
        };

        // Si este es el último producto y tiene datos válidos, agregar un nuevo campo automáticamente
        if (index === venta.productos.length - 1 && valor !== '') {
          nuevosProductos.push({ productoId: '', nombre: '', cantidad: 1, precio: 0 });
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

  const removerProducto = (index) => {
    const nuevosProductos = venta.productos.filter((_, i) => i !== index);
    setVenta({
      ...venta,
      productos: nuevosProductos
    });
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

      // Validate cliente ID is a valid number
      const cliente_id = parseInt(venta.clienteId);
      if (isNaN(cliente_id) || cliente_id <= 0) {
        alert('ID de cliente inválido');
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

      // Validar stock disponible
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
          subtotal: parseInt(producto.cantidad) * parseFloat(producto.precio)
        })),
        total: calcularTotal()
      };

      console.log('=== FRONTEND DEBUG ===');
      console.log('Selected cliente ID (raw):', venta.clienteId, 'Type:', typeof venta.clienteId);
      console.log('Processed cliente ID:', cliente_id, 'Type:', typeof cliente_id);
      console.log('Registering sale with data:', pdfData);

      // Reducir stock de productos vendidos
      await reducirStockProductos(productosValidos);

      // Guardar venta en localStorage
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

      // Store the registered sale data for PDF generation
      setVentaRegistrada(pdfData);

      alert('Venta registrada correctamente');

      // Reload data
      await cargarProductos();
      await cargarVentas();

    } catch (error) {
      console.error('Error creating sale:', error);
      alert(`Error al crear la venta: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate PDF from stored sale data
  const handleGeneratePDFFromRegistered = () => {
    if (!ventaRegistrada) {
      alert('No hay una venta registrada para generar PDF');
      return;
    }

    try {
      console.log('Generating PDF with data:', ventaRegistrada);
      generateAndDownloadInvoice(ventaRegistrada);

      // Reset form and clear registered sale after PDF generation
      setVenta({
        clienteId: '',
        clienteNombre: '',
        clienteEmail: '',
        clienteTelefono: '',
        clienteDireccion: '',
        fecha: new Date().toISOString().split('T')[0],
        productos: [{ productoId: '', nombre: '', cantidad: 1, precio: 0 }]
      });
      setVentaRegistrada(null);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el comprobante de venta');
    }
  };

  const Pagination = ({ totalPagesParam, currentPage, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPagesParam, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredVentas.length)} de {filteredVentas.length} ventas
        </div>

        <div className="pagination">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Primera página"
          >
            «
          </button>

          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Página anterior"
          >
            ‹
          </button>

          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Página siguiente"
          >
            ›
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Última página"
          >
            »
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="content">
      <div className="historial-header">
        <h1>Nueva Venta</h1>

        {/* Formulario de Nueva Venta */}
        <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            maxWidth: '1000px'
          }}>
            <h3>Registrar Nueva Venta</h3>

            <form className="venta-form" onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Cliente (F5):
                  </label>
                  <select
                    name="clienteId"
                    value={venta.clienteId}
                    onChange={handleClienteChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
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
                      fontSize: '12px',
                      color: '#666',
                      padding: '8px',
                      backgroundColor: '#fff',
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

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Fecha:
                  </label>
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
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4>Productos (F8):</h4>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0, fontStyle: 'italic' }}>
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
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  color: '#1565c0'
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
                    backgroundColor: '#fff'
                  }}>
                    <select
                      value={producto.productoId}
                      onChange={(e) => actualizarProducto(index, 'productoId', e.target.value)}
                      style={{
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        fontSize: '12px',
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
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    />

                    <input
                      type="number"
                      placeholder="Precio ₲"
                      value={producto.precio}
                      readOnly
                      style={{
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        width: '100%',
                        fontSize: '12px',
                        textAlign: 'right'
                      }}
                    />

                    <div style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1565c0',
                      fontSize: '11px',
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

              {/* Success message when sale is registered */}
              {ventaRegistrada && (
                <div style={{
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  border: '1px solid #c3e6cb',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                  <strong>✅ Venta registrada correctamente. Ahora puedes generar el PDF.</strong>
                </div>
              )}

              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '15px',
                borderRadius: '6px',
                border: '2px solid #2196f3',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#1565c0', margin: 0 }}>
                  TOTAL: {formatCurrency(calcularTotal())}
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                {/* Show Registrar Venta button if no sale has been registered yet */}
                {!ventaRegistrada && (
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: loading ? '#ccc' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrar Venta (F10)'}
                  </button>
                )}

                {/* Show Generar PDF button if sale has been registered */}
                {ventaRegistrada && (
                  <button
                    type="button"
                    onClick={handleGeneratePDFFromRegistered}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Generar PDF
                  </button>
                )}
              </div>
            </form>
          </div>

        {/* Modal de selección de clientes (F5) */}
        {showClienteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Seleccionar Cliente (F5)</h3>
                  <button
                    onClick={() => {
                      setShowClienteModal(false);
                      setClienteSearchTerm('');
                      setSelectedClienteIndex(0);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '0',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                  Usa ↑↓ para navegar, Enter para seleccionar, ESC para cerrar
                </div>
              </div>

              {/* Búsqueda de clientes */}
              <input
                type="text"
                placeholder="Buscar cliente por nombre o email..."
                value={clienteSearchTerm}
                onChange={(e) => setClienteSearchTerm(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              />

              {/* Lista de clientes */}
              <div
                ref={clienteListRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                {(() => {
                  const clientesFiltrados = clientesDisponibles.filter(cliente =>
                    cliente.nombre.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
                    (cliente.email && cliente.email.toLowerCase().includes(clienteSearchTerm.toLowerCase()))
                  );

                  return clientesFiltrados.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No se encontraron clientes
                    </div>
                  ) : (
                    clientesFiltrados.map((cliente, index) => {
                      const isSelected = venta.clienteId === cliente.id;
                      const isHighlighted = index === selectedClienteIndex;

                      return (
                        <div
                          key={cliente.id}
                          ref={isHighlighted ? selectedClienteRef : null}
                          onClick={() => {
                            handleClienteChange({ target: { value: cliente.id } });
                            setShowClienteModal(false);
                            setClienteSearchTerm('');
                            setSelectedClienteIndex(0);
                          }}
                          onMouseEnter={() => setSelectedClienteIndex(index)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'background-color 0.1s',
                            backgroundColor: isHighlighted
                              ? '#2196f3'
                              : isSelected
                              ? '#e3f2fd'
                              : 'transparent',
                            color: isHighlighted ? 'white' : 'inherit'
                          }}
                        >
                          <div style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            marginBottom: '4px',
                            color: isHighlighted ? 'white' : 'inherit'
                          }}>
                            {cliente.nombre}
                          </div>
                          {cliente.email && (
                            <div style={{
                              fontSize: '12px',
                              color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#666'
                            }}>
                              📧 {cliente.email}
                            </div>
                          )}
                          {cliente.telefono && (
                            <div style={{
                              fontSize: '12px',
                              color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#666'
                            }}>
                              📱 {cliente.telefono}
                            </div>
                          )}
                        </div>
                      );
                    })
                  );
                })()}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {clientesDisponibles.filter(cliente =>
                    cliente.nombre.toLowerCase().includes(clienteSearchTerm.toLowerCase()) ||
                    (cliente.email && cliente.email.toLowerCase().includes(clienteSearchTerm.toLowerCase()))
                  ).length} cliente(s) encontrado(s)
                </div>
                <button
                  onClick={() => {
                    setShowClienteModal(false);
                    setClienteSearchTerm('');
                    setSelectedClienteIndex(0);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cerrar (ESC)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de selección de productos (F8) */}
        {showProductoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Seleccionar Producto (F8)</h3>
                  <button
                    onClick={() => {
                      setShowProductoModal(false);
                      setProductoSearchTerm('');
                      setSelectedProductoIndex(0);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '0',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                  Usa ↑↓ para navegar, Enter para seleccionar, ESC para cerrar
                </div>
              </div>

              {/* Búsqueda de productos */}
              <input
                type="text"
                placeholder="Buscar producto por nombre o código..."
                value={productoSearchTerm}
                onChange={(e) => setProductoSearchTerm(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              />

              {/* Lista de productos */}
              <div
                ref={productoListRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                {(() => {
                  const productosFiltrados = productosDisponibles.filter(producto =>
                    producto.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
                    producto.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
                  );

                  return productosFiltrados.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No se encontraron productos
                    </div>
                  ) : (
                    productosFiltrados.map((producto, index) => {
                      const isHighlighted = index === selectedProductoIndex;

                      return (
                        <div
                          key={producto.id}
                          ref={isHighlighted ? selectedProductoRef : null}
                          onClick={() => {
                            actualizarProducto(currentProductRowIndex, 'productoId', producto.id.toString());
                            // Mover el cursor a la siguiente fila después de seleccionar
                            setCurrentProductRowIndex(prev => {
                              const nextIndex = prev + 1;
                              // Si será la última fila, actualizarProducto ya agregará una nueva
                              return nextIndex;
                            });
                            setShowProductoModal(false);
                            setProductoSearchTerm('');
                            setSelectedProductoIndex(0);
                          }}
                          onMouseEnter={() => setSelectedProductoIndex(index)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer',
                            transition: 'background-color 0.1s',
                            backgroundColor: isHighlighted ? '#2196f3' : 'transparent',
                            color: isHighlighted ? 'white' : 'inherit'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                fontSize: '14px',
                                marginBottom: '4px',
                                color: isHighlighted ? 'white' : 'inherit'
                              }}>
                                {producto.nombre}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#666'
                              }}>
                                Código: {producto.codigo}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: isHighlighted ? 'white' : '#2196f3',
                                marginBottom: '4px'
                              }}>
                                {formatCurrency(producto.precio)}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: isHighlighted
                                  ? 'rgba(255,255,255,0.9)'
                                  : producto.stock <= 5
                                  ? '#dc3545'
                                  : '#28a745',
                                fontWeight: producto.stock <= 5 ? 'bold' : 'normal'
                              }}>
                                Stock: {producto.stock}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  );
                })()}
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {productosDisponibles.filter(producto =>
                    producto.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase()) ||
                    producto.codigo.toLowerCase().includes(productoSearchTerm.toLowerCase())
                  ).length} producto(s) encontrado(s)
                </div>
                <button
                  onClick={() => {
                    setShowProductoModal(false);
                    setProductoSearchTerm('');
                    setSelectedProductoIndex(0);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cerrar (ESC)
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="search-container" style={{ flex: 1, marginRight: '20px' }}>
            <input
              type="text"
              placeholder="Buscar por número, cliente o fecha..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          {/* Controles de selección múltiple */}
          {currentVentas.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!isSelectMode ? (
                <button
                  onClick={toggleSelectMode}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Seleccionar Items
                </button>
              ) : (
                <>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {selectedVentas.length} seleccionado{selectedVentas.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={selectAllVentas}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedVentas.length === currentVentas.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </button>
                  <button
                    onClick={eliminarVentasSeleccionadas}
                    disabled={selectedVentas.length === 0}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: selectedVentas.length === 0 ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: selectedVentas.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedVentas.length === 0 ? 0.6 : 1
                    }}
                  >
                    Eliminar Seleccionados
                  </button>
                  <button
                    onClick={toggleSelectMode}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
          <button
            onClick={generarInformePDF}
            style={{
              padding: '0.5rem 1rem',
              border: '2px solid #2196f3',
              borderRadius: '5px',
              fontSize: '1rem',
              backgroundColor: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: 'auto',
              transition: 'border-color 0.3s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            {filtroMes === 'todos' ? 'Generar Informe General PDF' : 'Generar Informe Mensual PDF'}
          </button>
        </div>

        <div className="filtros">
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="filtro-select"
          >
            <option value="todos">Todos los meses</option>
            {obtenerMesesDisponibles().map(mes => (
              <option key={mes} value={mes}>
                {formatearMes(mes)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {isSelectMode && (
                <th style={{ textAlign: 'center', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={currentVentas.length > 0 && currentVentas.every(v => selectedVentas.includes(v.id))}
                    onChange={selectAllVentas}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentVentas.length === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? "6" : "6"} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {searchTerm ? 'No se encontraron ventas que coincidan con la búsqueda' : 'No hay ventas registradas'}
                </td>
              </tr>
            ) : (
              currentVentas.map(venta => (
                <tr key={venta.id}>
                  {isSelectMode && (
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedVentas.includes(venta.id)}
                        onChange={() => toggleSelectVenta(venta.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td>{venta.numero}</td>
                  <td>{venta.fecha}</td>
                  <td>{venta.cliente}</td>
                  <td>{formatCurrency(venta.monto)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleGeneratePDF(venta)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginRight: '4px'
                      }}
                      title="Ver/Descargar PDF"
                    >
                      Ver PDF
                    </button>
                    <button
                      onClick={() => handleDelete(venta)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Eliminar venta"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          totalPagesParam={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default HistorialVentas;
