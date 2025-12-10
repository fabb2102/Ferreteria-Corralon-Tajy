import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/HistorialComprobantes.css';
import { formatCurrency } from '../utils/currency';
import { generateAndDownloadInvoice } from '../utils/pdfGenerator';
import { apiService } from '../services/api';

function GestionCompras() {
  const [compras, setCompras] = useState([]);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filteredCompras, setFilteredCompras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para selección múltiple
  const [selectedCompras, setSelectedCompras] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Estados para nueva compra
  const [showCompraForm, setShowCompraForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState([]);
  const [compraRegistrada, setCompraRegistrada] = useState(null); // Para almacenar datos de la compra registrada
  const [compra, setCompra] = useState({
    proveedorId: '',
    proveedorNombre: '',
    proveedorRuc: '',
    proveedorTelefono: '',
    proveedorDireccion: '',
    fecha: new Date().toISOString().split('T')[0],
    productos: [{ productoId: '', nombre: '', cantidad: 1, costo: 0 }]
  });

  // Estados para modal de nuevo producto
  const [showNuevoProductoModal, setShowNuevoProductoModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    costo: '',
    categoria_id: '',
    proveedor_id: ''
  });
  const [categorias, setCategorias] = useState([]);

  // Estados para modales de selección con teclado
  const [showProveedorModal, setShowProveedorModal] = useState(false); // Modal F2
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [selectedProveedorIndex, setSelectedProveedorIndex] = useState(0);

  const [showProductoModal, setShowProductoModal] = useState(false); // Modal F3
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [selectedProductoIndex, setSelectedProductoIndex] = useState(0);
  const [currentProductRowIndex, setCurrentProductRowIndex] = useState(0);

  // Refs para scrolling automático
  const proveedorListRef = useRef(null);
  const selectedProveedorRef = useRef(null);
  const productoListRef = useRef(null);
  const selectedProductoRef = useRef(null);

  // Definir agregarProducto antes del useEffect que lo usa
  const agregarProducto = useCallback(() => {
    // Abrir modal para crear producto nuevo (igual que F5)
    setShowNuevoProductoModal(true);
  }, []);

  useEffect(() => {
    cargarCompras();
    cargarProveedores();
    cargarProductos();
    cargarCategorias();
  }, []);

  // Atajos de teclado: F2 (proveedor), F3 (producto), F5 (nuevo producto)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showCompraForm) return; // Solo funciona cuando el formulario está abierto

      // F2 - Abrir modal de proveedores
      if (e.key === 'F2') {
        e.preventDefault();
        setShowProveedorModal(true);
        setProveedorSearchTerm('');
        setSelectedProveedorIndex(0);
      }
      // F3 - Abrir modal de productos
      else if (e.key === 'F3') {
        e.preventDefault();
        setShowProductoModal(true);
        setProductoSearchTerm('');
        setSelectedProductoIndex(0);
      }
      // F5 - Crear nuevo producto en catálogo
      else if (e.key === 'F5') {
        e.preventDefault();
        setShowNuevoProductoModal(true);
      }
      // Modal de proveedores abierto
      else if (showProveedorModal) {
        const proveedoresFiltrados = proveedoresDisponibles.filter(proveedor =>
          proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
          (proveedor.ruc && proveedor.ruc.toLowerCase().includes(proveedorSearchTerm.toLowerCase()))
        );

        if (e.key === 'Escape') {
          setShowProveedorModal(false);
          setProveedorSearchTerm('');
          setSelectedProveedorIndex(0);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedProveedorIndex(prev =>
            prev < proveedoresFiltrados.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedProveedorIndex(prev => prev > 0 ? prev - 1 : 0);
        } else if (e.key === 'Enter' && proveedoresFiltrados.length > 0) {
          e.preventDefault();
          const proveedorSeleccionado = proveedoresFiltrados[selectedProveedorIndex];
          if (proveedorSeleccionado) {
            handleProveedorChange({ target: { value: proveedorSeleccionado.id } });
            setShowProveedorModal(false);
            setProveedorSearchTerm('');
            setSelectedProveedorIndex(0);
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
  }, [showCompraForm, showProveedorModal, showProductoModal, proveedorSearchTerm, productoSearchTerm, selectedProveedorIndex, selectedProductoIndex, proveedoresDisponibles, productosDisponibles, currentProductRowIndex, compra.productos]);

  // Auto-scroll para mantener el elemento seleccionado visible (proveedores)
  useEffect(() => {
    if (showProveedorModal && selectedProveedorRef.current) {
      selectedProveedorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedProveedorIndex, showProveedorModal]);

  // Auto-scroll para mantener el elemento seleccionado visible (productos)
  useEffect(() => {
    if (showProductoModal && selectedProductoRef.current) {
      selectedProductoRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedProductoIndex, showProductoModal]);

  // Resetear índice cuando cambia la búsqueda (proveedores)
  useEffect(() => {
    if (showProveedorModal) {
      setSelectedProveedorIndex(0);
    }
  }, [proveedorSearchTerm]);

  // Resetear índice cuando cambia la búsqueda (productos)
  useEffect(() => {
    if (showProductoModal) {
      setSelectedProductoIndex(0);
    }
  }, [productoSearchTerm]);

  const cargarCategorias = async () => {
    try {
      const categoriasData = await apiService.get('/categorias');
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      // Fallback con categorías básicas
      setCategorias([
        { id: 1, nombre: 'Herramientas' },
        { id: 2, nombre: 'Materiales' },
        { id: 3, nombre: 'Pinturas' }
      ]);
    }
  };

  // Cargar compras desde el backend
  const cargarCompras = async () => {
    try {
      setLoading(true);
      const comprasData = await apiService.get('/compras');
      
      // Transform backend data to match frontend format
      const comprasFormateadas = comprasData.map(compra => ({
        id: compra.id,
        numero: `001-001-${String(compra.id).padStart(6, '0')}`,
        tipo: 'compra',
        fecha: compra.fecha.split('T')[0], // Format date
        proveedor: compra.proveedor,
        ruc_proveedor: compra.ruc_proveedor,
        monto: compra.total,
        estado: 'completada',
        productos: compra.productos || []
      }));
      
      // Ordenar compras por fecha/id descendente (más recientes primero)
      const comprasOrdenadas = comprasFormateadas.sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha) || b.id - a.id;
      });
      
      setCompras(comprasOrdenadas);
    } catch (error) {
      console.error('Error al cargar compras:', error);
      // Fallback to empty array if error
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      console.log('=== CARGANDO PROVEEDORES (BACKEND + LOCALSTORAGE) ===');
      const token = localStorage.getItem('token');
      console.log('Token disponible para proveedores:', !!token);
      
      let proveedoresBackend = [];
      let proveedoresLocal = [];
      
      // Intentar cargar desde backend si hay token
      if (token) {
        try {
          console.log('Cargando proveedores desde backend...');
          const backendData = await apiService.get('/proveedores');
          console.log('📦 Datos crudos del backend:', backendData);
          console.log('📦 Primer proveedor (ejemplo):', backendData[0]);

          proveedoresBackend = backendData.map(p => ({
            id: p.id,
            nombre: p.nombre,
            ruc: p.ruc_proveedor || p.ruc || '',
            telefono: p.telefono_proveedor || p.telefono || '',
            direccion: p.direccion_proveedor || p.direccion || ''
          }));
          console.log('✅ Proveedores del backend mapeados:', proveedoresBackend);
          console.log('✅ Total proveedores:', proveedoresBackend.length);
        } catch (error) {
          console.log('❌ Error al cargar desde backend:', error.message);
        }
      }
      
      // Cargar proveedores del usuario desde localStorage
      const todosLosProveedores = JSON.parse(localStorage.getItem('todoslosproveedores') || '[]');
      console.log('📦 localStorage "todoslosproveedores":', todosLosProveedores);

      if (todosLosProveedores.length > 0) {
        proveedoresLocal = todosLosProveedores.map(p => ({
          id: p.id,
          nombre: p.nombre,
          ruc: p.ruc_proveedor || p.ruc || '',
          telefono: p.telefono_proveedor || p.telefono || '',
          direccion: p.direccion_proveedor || p.direccion || ''
        }));
        console.log('✅ Proveedores de localStorage mapeados:', proveedoresLocal);
        console.log('✅ Total proveedores localStorage:', proveedoresLocal.length);
      }
      
      // SOLO usar proveedores del backend cuando hay token para compras
      let proveedoresCombinados = [];
      
      if (token && proveedoresBackend.length > 0) {
        // SOLO usar proveedores del backend - no mezclar con localStorage para evitar conflictos de ID
        proveedoresCombinados = [...proveedoresBackend];
        console.log('🎯 Usando SOLO proveedores del backend para compras:', proveedoresCombinados);
      } else {
        // Sin token, usar localStorage como fallback
        proveedoresCombinados = [...proveedoresLocal];
        console.log('⚠️ Sin token - usando proveedores locales:', proveedoresCombinados);
      }
      
      // Si no hay proveedores de ninguna fuente, usar fallback
      if (proveedoresCombinados.length === 0) {
        console.log('⚠️ No hay proveedores disponibles, usando fallback');
        const fallbackProveedores = [
          { id: 1, nombre: 'Distribuidora Central S.A.', ruc: '80012345-7', telefono: '021-555-0001', direccion: 'Av. Mariscal López 1234, Asunción' },
          { id: 2, nombre: 'Ferretería Industrial del Este', ruc: '80023456-8', telefono: '061-444-0002', direccion: 'Ruta 2 Km 15, Ciudad del Este' },
          { id: 3, nombre: 'Pinturas y Acabados SA', ruc: '80034567-9', telefono: '021-333-0003', direccion: 'Av. España 567, Asunción' }
        ];
        console.log('📦 Usando proveedores de fallback:', fallbackProveedores);
        setProveedoresDisponibles(fallbackProveedores);
      } else {
        console.log(`🎯 Total proveedores disponibles: ${proveedoresCombinados.length}`);
        console.log('📦 Proveedores finales:', proveedoresCombinados);
        setProveedoresDisponibles(proveedoresCombinados);
      }
      
    } catch (error) {
      console.error('Error general al cargar proveedores:', error);
      // Fallback final
      const fallbackProveedores = [
        { id: 1, nombre: 'Distribuidora Central S.A.', ruc: '80012345-7', telefono: '021-555-0001', direccion: 'Av. Mariscal López 1234, Asunción' },
        { id: 2, nombre: 'Ferretería Industrial del Este', ruc: '80023456-8', telefono: '061-444-0002', direccion: 'Ruta 2 Km 15, Ciudad del Este' },
        { id: 3, nombre: 'Pinturas y Acabados SA', ruc: '80034567-9', telefono: '021-333-0003', direccion: 'Av. España 567, Asunción' }
      ];
      setProveedoresDisponibles(fallbackProveedores);
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
          productosBackend = backendData
            .filter(p => p.activo !== false) // Filtrar solo productos activos
            .map(p => ({
              id: p.id,
              codigo: p.codigo,
              nombre: p.nombre,
              precio: p.precio,
              // Si el backend no envía costo, inicializar en 0 para permitir edición manual
              costo: p.costo || 0,
              stock: p.stock,
              categoria: p.categoria,
              proveedor: p.proveedor,
              activo: p.activo
            }));
          console.log('✅ Productos activos del backend:', productosBackend.length);
        } catch (error) {
          console.log('❌ Error al cargar desde backend:', error.message);
        }
      }

      // Cargar productos del usuario desde localStorage
      const todosLosProductos = JSON.parse(localStorage.getItem('todolosproductos') || '[]');
      if (todosLosProductos.length > 0) {
        productosLocal = todosLosProductos
          .filter(p => p.activo !== false) // Filtrar solo productos activos
          .map(p => ({
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            precio: p.precio,
            costo: p.costo || 0,
            stock: p.stock,
            categoria: p.categoria,
            proveedor: p.proveedor,
            activo: p.activo
          }));
        console.log('✅ Productos activos de localStorage:', productosLocal.length);
      }

      // SOLO usar productos del backend cuando hay token para compras
      let productosCombinados = [];

      if (token && productosBackend.length > 0) {
        // SOLO usar productos del backend - no mezclar con localStorage para evitar conflictos de ID
        productosCombinados = [...productosBackend];
        console.log('🎯 Usando SOLO productos activos del backend para compras:', productosCombinados.length);
      } else {
        // Sin token, usar localStorage como fallback
        productosCombinados = [...productosLocal];
        console.log('⚠️ Sin token - usando productos activos locales:', productosCombinados.length);
      }

      // Si no hay productos de ninguna fuente, usar fallback
      if (productosCombinados.length === 0) {
        console.log('No hay productos activos, usando fallback');
        const fallbackProductos = [
          { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, costo: 15000, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A', activo: true },
          { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, costo: 7000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B', activo: true },
          { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, costo: 3000, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C', activo: true }
        ];
        setProductosDisponibles(fallbackProductos);
      } else {
        console.log(`🎯 Total productos activos disponibles: ${productosCombinados.length}`);
        setProductosDisponibles(productosCombinados);
      }

    } catch (error) {
      console.error('Error general al cargar productos:', error);
      // Fallback final
      const fallbackProductos = [
        { id: 1, codigo: 'PRD001', nombre: 'Martillo', precio: 25500, costo: 15000, stock: 15, categoria: 'Herramientas', proveedor: 'Proveedor A', activo: true },
        { id: 2, codigo: 'PRD002', nombre: 'Destornillador', precio: 12000, costo: 7000, stock: 30, categoria: 'Herramientas', proveedor: 'Proveedor B', activo: true },
        { id: 3, codigo: 'PRD003', nombre: 'Tornillos', precio: 5750, costo: 3000, stock: 100, categoria: 'Accesorios', proveedor: 'Proveedor C', activo: true }
      ];
      setProductosDisponibles(fallbackProductos);
    }
  };

  useEffect(() => {
    let filtered = compras.filter(comp => {
      // Filtro por mes
      if (filtroMes !== 'todos') {
        const fechaComp = new Date(comp.fecha);
        const mesComp = fechaComp.getFullYear() + '-' + String(fechaComp.getMonth() + 1).padStart(2, '0');
        if (mesComp !== filtroMes) return false;
      }
      
      // Filtro por búsqueda
      if (searchTerm) {
        return (
          comp.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.fecha.includes(searchTerm)
        );
      }
      
      return true;
    });
    
    setFilteredCompras(filtered);
    setCurrentPage(1);
  }, [compras, filtroMes, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCompras.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompras = filteredCompras.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Función para obtener meses únicos de las compras
  const obtenerMesesDisponibles = () => {
    const meses = new Set();
    compras.forEach(comp => {
      const fecha = new Date(comp.fecha);
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
    return filteredCompras.reduce((total, comp) => total + comp.monto, 0);
  };

  // Generar informe PDF (mensual o general)
  const generarInformePDF = () => {
    try {
      // Crear contenido del informe
      const fechaActual = new Date().toLocaleDateString();
      const totalCompras = filteredCompras.length;
      const montoTotal = calcularTotalMes();

      let titulo, tipoInforme;
      if (filtroMes === 'todos') {
        titulo = 'INFORME GENERAL - TODAS LAS COMPRAS';
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
          totalCompras,
          montoTotal: formatCurrency(montoTotal)
        },
        compras: filteredCompras.map(comp => ({
          numero: comp.numero,
          fecha: comp.fecha,
          proveedor: comp.proveedor,
          ruc_proveedor: comp.ruc_proveedor || 'N/A',
          monto: formatCurrency(comp.monto),
          productos: comp.productos || []  // ← Incluir productos de cada compra
        }))
      };

      console.log('=== DATOS PARA PDF DE COMPRAS ===');
      console.log('Total compras:', informeData.compras.length);
      console.log('Compras con productos:', informeData.compras);
      informeData.compras.forEach((comp, idx) => {
        console.log(`Compra ${idx + 1} (${comp.numero}):`, {
          proveedor: comp.proveedor,
          totalProductos: comp.productos ? comp.productos.length : 0,
          productos: comp.productos
        });
      });

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
          <p><strong>Total de compras:</strong> ${data.resumen.totalCompras}</p>
          <p><strong>Monto total comprado:</strong> ${data.resumen.montoTotal}</p>
        </div>

        <h3>Resumen de Compras</h3>
        <table class="tabla">
          <thead>
            <tr>
              <th>N° Compra</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>RUC</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.compras.map(comp => `
              <tr>
                <td>${comp.numero}</td>
                <td>${comp.fecha}</td>
                <td>${comp.proveedor}</td>
                <td>${comp.ruc_proveedor}</td>
                <td style="text-align: right;">${comp.monto}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td colspan="4" style="text-align: right;"><strong>TOTAL GENERAL:</strong></td>
              <td style="text-align: right;"><strong>${data.resumen.montoTotal}</strong></td>
            </tr>
          </tbody>
        </table>

        <h3 style="margin-top: 40px;">Detalle de Productos por Compra</h3>
        ${data.compras.map(comp => `
          <div style="margin-bottom: 25px; page-break-inside: avoid;">
            <h4 style="color: #1565c0; margin-bottom: 10px; border-bottom: 2px solid #2196f3; padding-bottom: 5px;">
              Compra N° ${comp.numero} - ${comp.fecha} - ${comp.proveedor}
            </h4>
            ${comp.productos && comp.productos.length > 0 ? `
              <table class="tabla" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center; width: 80px;">Cantidad</th>
                    <th style="text-align: right; width: 120px;">Costo Unit.</th>
                    <th style="text-align: right; width: 120px;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${comp.productos.map(prod => {
                    const cantidad = prod.cantidad || 0;
                    const costo = prod.costo || prod.precio || 0;
                    const subtotal = cantidad * costo;
                    return `
                    <tr>
                      <td>${prod.nombre || 'Producto sin nombre'}</td>
                      <td style="text-align: center;">${cantidad}</td>
                      <td style="text-align: right;">${formatCurrency(costo)}</td>
                      <td style="text-align: right;">${formatCurrency(subtotal)}</td>
                    </tr>
                  `}).join('')}
                  <tr class="total">
                    <td colspan="3" style="text-align: right;"><strong>Total Compra:</strong></td>
                    <td style="text-align: right;"><strong>${comp.monto}</strong></td>
                  </tr>
                </tbody>
              </table>
            ` : `
              <p style="color: #999; font-style: italic; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                Sin productos registrados para esta compra
              </p>
            `}
          </div>
        `).join('')}

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

  const handleGeneratePDF = (compra) => {
    try {
      // Convert compra data to invoice format
      const ventaData = {
        id: compra.id,
        fecha: compra.fecha,
        cliente: compra.proveedor,
        productos: compra.productos || [
          {
            nombre: `Compra ${compra.tipo}`,
            cantidad: 1,
            precio: compra.monto
          }
        ],
        total: compra.monto
      };

      // Generate and download PDF
      generateAndDownloadInvoice(ventaData);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el comprobante de compra');
    }
  };
  
  const handleEdit = (compra) => {
    alert(`Editar compra: ${compra.numero}`);
    // TODO: Implement edit functionality
  };
  
  const handleDelete = async (compra) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la compra ${compra.numero}?`)) {
      try {
        // Note: In a real implementation, you'd need a DELETE endpoint
        // For now, we'll keep using localStorage for deletion
        console.log('Deleting compra:', compra.id);
        alert('La eliminación de compras desde el backend no está implementada aún');
      } catch (error) {
        console.error('Error al eliminar compra:', error);
        alert('Error al eliminar la compra. Revisa la consola para más detalles.');
      }
    }
  };

  // Funciones para selección múltiple
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedCompras([]);
  };

  const toggleSelectCompra = (compraId) => {
    setSelectedCompras(prev => 
      prev.includes(compraId) 
        ? prev.filter(id => id !== compraId)
        : [...prev, compraId]
    );
  };

  const selectAllCompras = () => {
    const currentPageIds = currentCompras.map(c => c.id);
    const allCurrentSelected = currentPageIds.every(id => selectedCompras.includes(id));
    
    if (allCurrentSelected) {
      // Deseleccionar todos los de la página actual
      setSelectedCompras(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Seleccionar todos los de la página actual (mantener los de otras páginas)
      setSelectedCompras(prev => {
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

  const eliminarComprasSeleccionadas = async () => {
    if (selectedCompras.length === 0) {
      alert('No hay compras seleccionadas para eliminar');
      return;
    }

    const mensaje = `¿Estás seguro de que deseas eliminar ${selectedCompras.length} compra${selectedCompras.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`;
    
    if (window.confirm(mensaje)) {
      try {
        const response = await apiService.delete('/compras/bulk', {
          ids: selectedCompras
        });
        
        console.log('Bulk delete response:', response);
        alert(`${response.deletedCount} compras eliminadas exitosamente`);
        
        // Reload data from backend
        await cargarCompras();
        setSelectedCompras([]);
        setIsSelectMode(false);
        
      } catch (error) {
        console.error('Error al eliminar compras:', error);
        alert(`Error al eliminar compras: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  // Funciones para nueva compra
  const calcularTotal = () => {
    return compra.productos.reduce((total, producto) => {
      return total + (parseFloat(producto.cantidad) || 0) * (parseFloat(producto.costo) || 0);
    }, 0);
  };

  const handleChange = (e) => {
    setCompra({
      ...compra,
      [e.target.name]: e.target.value
    });
  };

  const handleProveedorChange = (e) => {
    const proveedorId = e.target.value;

    console.log('=== PROVEEDOR CHANGE DEBUG ===');
    console.log('Proveedor ID seleccionado (raw):', proveedorId, 'Tipo:', typeof proveedorId);
    console.log('Proveedores disponibles:', proveedoresDisponibles);
    console.log('IDs de proveedores:', proveedoresDisponibles.map(p => ({ id: p.id, tipo: typeof p.id })));

    // Convertir a número para comparación exacta
    const proveedorSeleccionado = proveedoresDisponibles.find(p => p.id === parseInt(proveedorId));
    console.log('Proveedor encontrado:', proveedorSeleccionado);

    if (proveedorSeleccionado) {
      setCompra({
        ...compra,
        proveedorId: proveedorId,
        proveedorNombre: proveedorSeleccionado.nombre,
        proveedorRuc: proveedorSeleccionado.ruc || '',
        proveedorTelefono: proveedorSeleccionado.telefono || '',
        proveedorDireccion: proveedorSeleccionado.direccion || ''
      });
      console.log('✅ Datos del proveedor asignados:', {
        nombre: proveedorSeleccionado.nombre,
        ruc: proveedorSeleccionado.ruc,
        telefono: proveedorSeleccionado.telefono,
        direccion: proveedorSeleccionado.direccion
      });
    } else {
      setCompra({
        ...compra,
        proveedorId: '',
        proveedorNombre: '',
        proveedorRuc: '',
        proveedorTelefono: '',
        proveedorDireccion: ''
      });
      console.log('⚠️ No se encontró proveedor, limpiando datos');
    }
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...compra.productos];

    if (campo === 'productoId') {
      // Si se selecciona un producto, cargar automáticamente su precio de costo guardado
      const productoSeleccionado = productosDisponibles.find(p => p.id === parseInt(valor));
      if (productoSeleccionado) {
        const costoProducto = productoSeleccionado.costo || productoSeleccionado.precio || 0;
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          productoId: valor,
          nombre: productoSeleccionado.nombre,
          costo: costoProducto // Cargar costo conocido o precio como referencia
        };

        // Si es la última línea y se seleccionó un producto, agregar automáticamente una nueva línea vacía
        if (index === nuevosProductos.length - 1) {
          nuevosProductos.push({ productoId: '', nombre: '', cantidad: 1, costo: 0 });
        }
      } else {
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          productoId: '',
          nombre: '',
          costo: 0
        };
      }
    } else {
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        [campo]: valor
      };
    }

    setCompra({
      ...compra,
      productos: nuevosProductos
    });
  };

  const removerProducto = (index) => {
    const nuevosProductos = compra.productos.filter((_, i) => i !== index);
    setCompra({
      ...compra,
      productos: nuevosProductos
    });
  };

  // Funciones para modal de nuevo producto
  const handleNuevoProductoChange = (e) => {
    setNuevoProducto({
      ...nuevoProducto,
      [e.target.name]: e.target.value
    });
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos requeridos
      if (!nuevoProducto.nombre.trim()) {
        alert('El nombre del producto es obligatorio');
        setLoading(false);
        return;
      }
      if (!nuevoProducto.precio || parseFloat(nuevoProducto.precio) <= 0) {
        alert('El precio de venta es obligatorio y debe ser mayor a cero');
        setLoading(false);
        return;
      }
      if (!nuevoProducto.categoria_id) {
        alert('Debes seleccionar una categoría');
        setLoading(false);
        return;
      }

      // Preparar datos del producto (código y stock se generan automáticamente en el backend)
      const productoData = {
        nombre: nuevoProducto.nombre.trim(),
        precio: parseFloat(nuevoProducto.precio),
        costo: nuevoProducto.costo ? parseFloat(nuevoProducto.costo) : 0,
        categoria_id: parseInt(nuevoProducto.categoria_id),
        proveedor_id: parseInt(nuevoProducto.proveedor_id || compra.proveedorId) || null
      };

      console.log('Creando producto:', productoData);

      // Crear producto en el backend
      const productoCreado = await apiService.post('/productos', productoData);
      console.log('Producto creado con código automático:', productoCreado);

      alert(`Producto creado exitosamente con código ${productoCreado.codigo}`);

      // Recargar productos
      await cargarProductos();

      // Cerrar modal y limpiar formulario
      setShowNuevoProductoModal(false);
      setNuevoProducto({
        nombre: '',
        precio: '',
        costo: '',
        categoria_id: '',
        proveedor_id: ''
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      alert(`Error al crear el producto: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!compra.proveedorId || !compra.proveedorNombre.trim()) {
        alert('Por favor selecciona un proveedor');
        setLoading(false);
        return;
      }

      // Validate proveedor ID is a valid number
      const proveedor_id = parseInt(compra.proveedorId);
      if (isNaN(proveedor_id) || proveedor_id <= 0) {
        alert('ID de proveedor inválido');
        setLoading(false);
        return;
      }

      // Validate products
      const productosValidos = compra.productos.filter(p =>
        p.productoId && p.nombre.trim() && p.cantidad > 0 && p.costo > 0
      );

      if (productosValidos.length === 0) {
        alert('Por favor agrega al menos un producto válido con cantidad y costo mayores a cero');
        setLoading(false);
        return;
      }

      // Prepare data for backend API - enviar proveedor_id como número
      const compraData = {
        proveedorId: proveedor_id,  // Campo que recibirá el backend
        productos: productosValidos.map(producto => ({
          productoId: parseInt(producto.productoId),
          cantidad: parseInt(producto.cantidad),
          costo: parseFloat(producto.costo)
        })),
        total: calcularTotal()
      };

      console.log('=== FRONTEND DEBUG ===');
      console.log('Selected proveedor ID (raw):', compra.proveedorId, 'Type:', typeof compra.proveedorId);
      console.log('Processed proveedor ID:', proveedor_id, 'Type:', typeof proveedor_id);
      console.log('Available proveedores:', proveedoresDisponibles.map(p => ({ id: p.id, type: typeof p.id, nombre: p.nombre })));
      console.log('Sending purchase to backend:', compraData);

      // Send purchase to backend
      const nuevaCompra = await apiService.post('/compras', compraData);
      console.log('Purchase created:', nuevaCompra);

      alert('Compra registrada correctamente');

      // Reload data from backend
      await cargarProductos();
      await cargarCompras();

      // Reset form immediately after successful registration
      setCompra({
        proveedorId: '',
        proveedorNombre: '',
        proveedorRuc: '',
        proveedorTelefono: '',
        proveedorDireccion: '',
        fecha: new Date().toISOString().split('T')[0],
        productos: [{ productoId: '', nombre: '', cantidad: 1, costo: 0 }]
      });
      setCompraRegistrada(null);

    } catch (error) {
      console.error('Error creating purchase:', error);
      alert(`Error al crear la compra: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
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
          Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredCompras.length)} de {filteredCompras.length} compras
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
        <h1>Gestión de Compras</h1>

        {/* Formulario de Nueva Compra */}
        {showCompraForm && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            maxWidth: '1000px'
          }}>
            <h3>Crear Nueva Compra</h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Proveedor (F2):
                  </label>
                  <select
                    name="proveedorId"
                    value={compra.proveedorId}
                    onChange={handleProveedorChange}
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
                    <option value="">Seleccionar proveedor...</option>
                    {proveedoresDisponibles.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                  {compra.proveedorNombre && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: '#666',
                      padding: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}>
                      <strong>{compra.proveedorNombre}</strong><br/>
                      {compra.proveedorRuc && <span>🏢 RUC: {compra.proveedorRuc}<br/></span>}
                      {compra.proveedorTelefono && <span>📱 {compra.proveedorTelefono}<br/></span>}
                      {compra.proveedorDireccion && <span>📍 {compra.proveedorDireccion}</span>}
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
                    value={compra.fecha}
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
                  <h4>Productos (F3):</h4>
                  <button
                    type="button"
                    onClick={agregarProducto}
                    title="Atajo: Presiona F5 para agregar producto rápidamente"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    + Agregar Producto
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'normal'
                    }}>
                      F5
                    </span>
                  </button>
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
                  <div style={{ textAlign: 'center' }}>Costo Proveedor</div>
                  <div style={{ textAlign: 'center' }}>Subtotal</div>
                  <div style={{ textAlign: 'center' }}>Acc.</div>
                </div>

                {compra.productos.map((producto, index) => (
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
                        fontSize: '12px'
                      }}
                    >
                      <option value="">Seleccionar producto...</option>
                      {productosDisponibles.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.codigo} - {prod.nombre} (Stock: {prod.stock})
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number"
                      placeholder="Cant."
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
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
                      placeholder="Precio costo ₲"
                      min="0"
                      step="1"
                      value={producto.costo || ''}
                      style={{
                        padding: '6px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '100%',
                        fontSize: '12px',
                        textAlign: 'right',
                        backgroundColor: 'white'
                      }}
                      onChange={(e) => actualizarProducto(index, 'costo', e.target.value)}
                    />

                    <div style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1565c0',
                      fontSize: '11px',
                      padding: '6px 2px'
                    }}>
                      {formatCurrency((producto.cantidad || 0) * (producto.costo || 0))}
                    </div>
                    
                    {compra.productos.length > 1 && index !== compra.productos.length - 1 && (
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
                <button
                  type="button"
                  onClick={() => {
                    setCompraRegistrada(null);
                    setCompra({
                      proveedorId: '',
                      proveedorNombre: '',
                      proveedorRuc: '',
                      proveedorTelefono: '',
                      proveedorDireccion: '',
                      fecha: new Date().toISOString().split('T')[0],
                      productos: [{ productoId: '', nombre: '', cantidad: 1, costo: 0 }]
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Limpiar Formulario
                </button>

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
                  {loading ? 'Registrando...' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="search-container" style={{ flex: 1, marginRight: '20px' }}>
            <input
              type="text"
              placeholder="Buscar por número, proveedor o fecha..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          {/* Controles de selección múltiple */}
          {currentCompras.length > 0 && (
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
                    {selectedCompras.length} seleccionado{selectedCompras.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={selectAllCompras}
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
                    {selectedCompras.length === currentCompras.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </button>
                  <button
                    onClick={eliminarComprasSeleccionadas}
                    disabled={selectedCompras.length === 0}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: selectedCompras.length === 0 ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: selectedCompras.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedCompras.length === 0 ? 0.6 : 1
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
                    checked={currentCompras.length > 0 && currentCompras.every(c => selectedCompras.includes(c.id))}
                    onChange={selectAllCompras}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              <th>Número</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>RUC Proveedor</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {currentCompras.length === 0 ? (
              <tr>
                <td colSpan={isSelectMode ? "7" : "6"} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  {searchTerm ? 'No se encontraron compras que coincidan con la búsqueda' : 'No hay compras registradas'}
                </td>
              </tr>
            ) : (
              currentCompras.map(compra => (
                <tr key={compra.id}>
                  {isSelectMode && (
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedCompras.includes(compra.id)}
                        onChange={() => toggleSelectCompra(compra.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td>{compra.numero}</td>
                  <td>{compra.fecha}</td>
                  <td>{compra.proveedor}</td>
                  <td>{compra.ruc_proveedor || 'N/A'}</td>
                  <td>{formatCurrency(compra.monto)}</td>
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

      {/* Modal para crear nuevo producto */}
      {showNuevoProductoModal && (
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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              Crear Nuevo Producto
            </h3>

            <form onSubmit={handleCrearProducto}>
              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '12px',
                color: '#1565c0'
              }}>
                ℹ️ El código se generará automáticamente. El stock inicial será 0 y se actualizará al registrar compras.
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Nombre del Producto: *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoProducto.nombre}
                  onChange={handleNuevoProductoChange}
                  required
                  placeholder="Ej: Martillo de 500g"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Precio de Venta: *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={nuevoProducto.precio}
                  onChange={handleNuevoProductoChange}
                  required
                  min="0"
                  step="1"
                  placeholder="Precio de venta al público"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Precio al que se venderá al cliente
                </small>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Precio de Costo: (Opcional)
                </label>
                <input
                  type="number"
                  name="costo"
                  value={nuevoProducto.costo}
                  onChange={handleNuevoProductoChange}
                  min="0"
                  step="1"
                  placeholder="Precio de costo del proveedor"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Precio al que se compra al proveedor (se actualizará con las compras)
                </small>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Categoría: *
                </label>
                <select
                  name="categoria_id"
                  value={nuevoProducto.categoria_id}
                  onChange={handleNuevoProductoChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Proveedor: (Opcional)
                </label>
                <select
                  name="proveedor_id"
                  value={nuevoProducto.proveedor_id || compra.proveedorId}
                  onChange={handleNuevoProductoChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Sin proveedor asignado</option>
                  {proveedoresDisponibles.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
                {compra.proveedorId && (
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Se usará el proveedor de la compra actual si no seleccionas otro
                  </small>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNuevoProductoModal(false);
                    setNuevoProducto({
                      nombre: '',
                      precio: '',
                      costo: '',
                      categoria_id: '',
                      proveedor_id: ''
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {loading ? 'Creando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de selección de proveedores (F2) */}
      {showProveedorModal && (
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
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Seleccionar Proveedor (F2)</h3>
                <button
                  onClick={() => {
                    setShowProveedorModal(false);
                    setProveedorSearchTerm('');
                    setSelectedProveedorIndex(0);
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

            <input
              type="text"
              placeholder="Buscar proveedor por nombre o RUC..."
              value={proveedorSearchTerm}
              onChange={(e) => setProveedorSearchTerm(e.target.value)}
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

            <div
              ref={proveedorListRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {(() => {
                const proveedoresFiltrados = proveedoresDisponibles.filter(proveedor =>
                  proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                  (proveedor.ruc && proveedor.ruc.toLowerCase().includes(proveedorSearchTerm.toLowerCase()))
                );

                return proveedoresFiltrados.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    No se encontraron proveedores
                  </div>
                ) : (
                  proveedoresFiltrados.map((proveedor, index) => {
                    const isSelected = compra.proveedorId === proveedor.id.toString();
                    const isHighlighted = index === selectedProveedorIndex;

                    return (
                      <div
                        key={proveedor.id}
                        ref={isHighlighted ? selectedProveedorRef : null}
                        onClick={() => {
                          handleProveedorChange({ target: { value: proveedor.id } });
                          setShowProveedorModal(false);
                          setProveedorSearchTerm('');
                          setSelectedProveedorIndex(0);
                        }}
                        onMouseEnter={() => setSelectedProveedorIndex(index)}
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
                          {proveedor.nombre}
                        </div>
                        {proveedor.ruc && (
                          <div style={{
                            fontSize: '12px',
                            color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#666'
                          }}>
                            🏢 RUC: {proveedor.ruc}
                          </div>
                        )}
                        {proveedor.telefono && (
                          <div style={{
                            fontSize: '12px',
                            color: isHighlighted ? 'rgba(255,255,255,0.9)' : '#666'
                          }}>
                            📱 {proveedor.telefono}
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
                {proveedoresDisponibles.filter(proveedor =>
                  proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                  (proveedor.ruc && proveedor.ruc.toLowerCase().includes(proveedorSearchTerm.toLowerCase()))
                ).length} proveedor(es) encontrado(s)
              </div>
              <button
                onClick={() => {
                  setShowProveedorModal(false);
                  setProveedorSearchTerm('');
                  setSelectedProveedorIndex(0);
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

      {/* Modal de selección de productos (F3) */}
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
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Seleccionar Producto (F3)</h3>
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
                          setCurrentProductRowIndex(prev => prev + 1);
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
                              Costo: {formatCurrency(producto.costo || 0)}
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
    </div>
  );
}

export default GestionCompras;
