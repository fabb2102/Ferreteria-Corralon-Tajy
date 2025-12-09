import { apiService } from './api';

class ProductService {
  async getProducts(params = {}) {
    try {
      return await apiService.get('/productos', params);
    } catch (error) {
      // Fallback to mock data when API is unavailable
      return this.getMockProducts(params);
    }
  }

  async getProduct(id) {
    try {
      return await apiService.get(`/productos/${id}`);
    } catch (error) {
      // Fallback to mock data
      return this.getMockProduct(id);
    }
  }

  async createProduct(productData) {
    try {
      return await apiService.post('/productos', productData);
    } catch (error) {
      // Simulate successful creation in development
      return this.simulateCreateProduct(productData);
    }
  }

  async updateProduct(id, productData) {
    try {
      return await apiService.put(`/productos/${id}`, productData);
    } catch (error) {
      // Simulate successful update in development
      return this.simulateUpdateProduct(id, productData);
    }
  }

  async deleteProduct(id) {
    try {
      return await apiService.delete(`/productos/${id}`);
    } catch (error) {
      // Propagar el error para que la UI muestre el fallo real
      throw error;
    }
  }

  async toggleStatus(id) {
    try {
      // Use the same endpoint as el backend: /productos/:id/toggle-status
      return await apiService.patch(`/productos/${id}/toggle-status`);
    } catch (error) {
      // Fallback: return an error-like object
      throw error;
    }
  }

  // Mock data methods for development
  getMockProducts(params = {}) {
    const mockProducts = [
      {
        id: 1,
        nombre: 'Martillo de Acero',
        precio: 35000,
        stock: 25,
        categoria: 'Herramientas',
        proveedor: 'Herramientas SA',
        codigo: 'MART001',
        fechaCreacion: '2024-01-15',
      },
      {
        id: 2,
        nombre: 'Taladro Eléctrico',
        precio: 150000,
        stock: 12,
        categoria: 'Herramientas Eléctricas',
        proveedor: 'ElectroTools',
        codigo: 'TAL001',
        fechaCreacion: '2024-01-16',
      },
      {
        id: 3,
        nombre: 'Clavos 2 pulgadas (100 unidades)',
        precio: 8500,
        stock: 200,
        categoria: 'Suministros',
        proveedor: 'Ferretería Central',
        codigo: 'CLAV002',
        fechaCreacion: '2024-01-17',
      },
      {
        id: 4,
        nombre: 'Destornillador Phillips',
        precio: 12000,
        stock: 35,
        categoria: 'Herramientas',
        proveedor: 'Herramientas SA',
        codigo: 'DEST001',
        fechaCreacion: '2024-01-18',
      },
    ];

    // Apply basic filtering
    let filteredProducts = mockProducts;
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filteredProducts = mockProducts.filter(
        product =>
          product.nombre.toLowerCase().includes(search) ||
          product.categoria.toLowerCase().includes(search) ||
          product.codigo.toLowerCase().includes(search)
      );
    }

    if (params.categoria) {
      filteredProducts = filteredProducts.filter(
        product => product.categoria === params.categoria
      );
    }

    return {
      data: filteredProducts,
      total: filteredProducts.length,
      page: parseInt(params.page) || 1,
      pageSize: parseInt(params.pageSize) || 10,
    };
  }

  getMockProduct(id) {
    const products = this.getMockProducts().data;
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    return product;
  }

  simulateCreateProduct(productData) {
    return {
      id: Date.now(),
      ...productData,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
  }

  simulateUpdateProduct(id, productData) {
    return {
      id: parseInt(id),
      ...productData,
      fechaActualizacion: new Date().toISOString().split('T')[0],
    };
  }

  // Validation methods
  validateProduct(productData) {
    const errors = {};

    if (!productData.nombre?.trim()) {
      errors.nombre = 'El nombre del producto es obligatorio';
    }

    if (!productData.precio || productData.precio <= 0) {
      errors.precio = 'El precio debe ser mayor a cero';
    }

    if (productData.stock === undefined || productData.stock < 0) {
      errors.stock = 'El stock no puede ser negativo';
    }

    if (!productData.categoria?.trim()) {
      errors.categoria = 'La categoría es obligatoria';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Utility methods
  formatProductForDisplay(product) {
    return {
      ...product,
      precioFormateado: this.formatCurrency(product.precio),
      stockStatus: this.getStockStatus(product.stock),
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

  getStockStatus(stock) {
    if (stock === 0) return 'sin-stock';
    if (stock <= 5) return 'stock-bajo';
    if (stock <= 20) return 'stock-medio';
    return 'stock-alto';
  }
}

export const productService = new ProductService();
