import { apiService } from './api';
import { generateAndDownloadInvoice } from '../utils/pdfGenerator';

class InvoiceService {
  async getInvoices(params = {}) {
    try {
      return await apiService.get('/api/ventas', params);
    } catch (error) {
      return this.getMockInvoices(params);
    }
  }

  async getInvoice(id) {
    try {
      return await apiService.get(`/api/ventas/${id}`);
    } catch (error) {
      return this.getMockInvoice(id);
    }
  }

  async createInvoice(invoiceData) {
    try {
      return await apiService.post('/api/ventas', invoiceData);
    } catch (error) {
      return this.simulateCreateInvoice(invoiceData);
    }
  }

  async updateInvoice(id, invoiceData) {
    try {
      return await apiService.put(`/api/ventas/${id}`, invoiceData);
    } catch (error) {
      return this.simulateUpdateInvoice(id, invoiceData);
    }
  }

  async deleteInvoice(id) {
    try {
      return await apiService.delete(`/api/ventas/${id}`);
    } catch (error) {
      return { success: true, message: 'Factura eliminada exitosamente' };
    }
  }

  // PDF Generation
  async generateInvoicePDF(invoiceData) {
    try {
      // Enrich invoice data with formatted information
      const enrichedData = this.enrichInvoiceData(invoiceData);
      generateAndDownloadInvoice(enrichedData);
      return { success: true, message: 'PDF generado exitosamente' };
    } catch (error) {
      throw new Error('Error al generar el PDF: ' + error.message);
    }
  }

  // Mock data methods
  getMockInvoices(params = {}) {
    const mockInvoices = [
      {
        id: 1,
        numero: 'FACT-001',
        fecha: '2024-01-20',
        clienteId: 1,
        clienteNombre: 'Juan Pérez',
        clienteEmail: 'juan@email.com',
        productos: [
          { id: 1, nombre: 'Martillo de Acero', cantidad: 2, precio: 35000 },
          { id: 3, nombre: 'Clavos 2 pulgadas', cantidad: 1, precio: 8500 },
        ],
        subtotal: 78500,
        impuestos: 7850,
        total: 86350,
        estado: 'pagada',
        metodoPago: 'efectivo',
      },
      {
        id: 2,
        numero: 'FACT-002',
        fecha: '2024-01-21',
        clienteId: 2,
        clienteNombre: 'María García',
        clienteEmail: 'maria@email.com',
        productos: [
          { id: 2, nombre: 'Taladro Eléctrico', cantidad: 1, precio: 150000 },
        ],
        subtotal: 150000,
        impuestos: 15000,
        total: 165000,
        estado: 'pendiente',
        metodoPago: 'transferencia',
      },
    ];

    let filteredInvoices = mockInvoices;

    // Apply filters
    if (params.cliente) {
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.clienteNombre.toLowerCase().includes(params.cliente.toLowerCase())
      );
    }

    if (params.estado) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.estado === params.estado);
    }

    if (params.fechaInicio) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.fecha >= params.fechaInicio);
    }

    if (params.fechaFin) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.fecha <= params.fechaFin);
    }

    return {
      data: filteredInvoices,
      total: filteredInvoices.length,
      page: parseInt(params.page) || 1,
      pageSize: parseInt(params.pageSize) || 10,
    };
  }

  getMockInvoice(id) {
    const invoices = this.getMockInvoices().data;
    const invoice = invoices.find(inv => inv.id === parseInt(id));
    
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    
    return invoice;
  }

  simulateCreateInvoice(invoiceData) {
    const now = new Date();
    const invoiceNumber = `FACT-${String(Date.now()).slice(-6)}`;
    
    return {
      id: Date.now(),
      numero: invoiceNumber,
      fecha: now.toISOString().split('T')[0],
      ...invoiceData,
      subtotal: this.calculateSubtotal(invoiceData.productos),
      impuestos: this.calculateTaxes(invoiceData.productos),
      total: this.calculateTotal(invoiceData.productos),
      estado: 'pendiente',
      fechaCreacion: now.toISOString(),
    };
  }

  simulateUpdateInvoice(id, invoiceData) {
    return {
      id: parseInt(id),
      ...invoiceData,
      subtotal: this.calculateSubtotal(invoiceData.productos),
      impuestos: this.calculateTaxes(invoiceData.productos),
      total: this.calculateTotal(invoiceData.productos),
      fechaActualizacion: new Date().toISOString(),
    };
  }

  // Calculation methods
  calculateSubtotal(productos = []) {
    return productos.reduce((sum, producto) => {
      return sum + (producto.cantidad * producto.precio);
    }, 0);
  }

  calculateTaxes(productos = []) {
    const subtotal = this.calculateSubtotal(productos);
    return subtotal * 0.1; // 10% tax rate
  }

  calculateTotal(productos = []) {
    const subtotal = this.calculateSubtotal(productos);
    const taxes = this.calculateTaxes(productos);
    return subtotal + taxes;
  }

  // Validation methods
  validateInvoice(invoiceData) {
    const errors = {};

    if (!invoiceData.clienteId) {
      errors.clienteId = 'Debe seleccionar un cliente';
    }

    if (!invoiceData.productos || invoiceData.productos.length === 0) {
      errors.productos = 'Debe agregar al menos un producto';
    } else {
      // Validate each product
      invoiceData.productos.forEach((producto, index) => {
        if (!producto.id) {
          errors[`producto_${index}_id`] = 'Producto inválido';
        }
        if (!producto.cantidad || producto.cantidad <= 0) {
          errors[`producto_${index}_cantidad`] = 'Cantidad debe ser mayor a cero';
        }
        if (!producto.precio || producto.precio <= 0) {
          errors[`producto_${index}_precio`] = 'Precio debe ser mayor a cero';
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Utility methods
  enrichInvoiceData(invoiceData) {
    return {
      ...invoiceData,
      productos: invoiceData.productos?.map(producto => ({
        ...producto,
        subtotal: producto.cantidad * producto.precio,
      })),
      subtotalFormateado: this.formatCurrency(invoiceData.subtotal || this.calculateSubtotal(invoiceData.productos)),
      impuestosFormateados: this.formatCurrency(invoiceData.impuestos || this.calculateTaxes(invoiceData.productos)),
      totalFormateado: this.formatCurrency(invoiceData.total || this.calculateTotal(invoiceData.productos)),
    };
  }

  formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₲ 0';
    }
    
    const numericAmount = parseFloat(amount);
    return `₲ ${numericAmount.toLocaleString('es-PY', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  }

  getStatusColor(estado) {
    const statusColors = {
      'pagada': '#4CAF50',
      'pendiente': '#ff9800',
      'vencida': '#f44336',
      'cancelada': '#9e9e9e',
    };
    return statusColors[estado] || '#9e9e9e';
  }

  getStatusText(estado) {
    const statusTexts = {
      'pagada': 'Pagada',
      'pendiente': 'Pendiente',
      'vencida': 'Vencida',
      'cancelada': 'Cancelada',
    };
    return statusTexts[estado] || 'Desconocido';
  }
}

export const invoiceService = new InvoiceService();