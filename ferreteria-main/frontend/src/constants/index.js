// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  PANEL: '/panel',
  PRODUCTS: {
    LIST: '/panel/productos/listar',
    CREATE: '/panel/productos/ingresar',
    EDIT: (id) => `/panel/productos/editar/${id}`,
  },
  CLIENTS: {
    LIST: '/panel/clientes/listar',
    CREATE: '/panel/clientes/nuevo',
    EDIT: (id) => `/panel/clientes/editar/${id}`,
  },
  INVOICES: {
    LIST: '/panel/facturas/historial',
    CREATE: '/panel/factura/nueva',
    VIEW: (id) => `/panel/facturas/${id}`,
  },
  RECEIPTS: {
    LIST: '/panel/comprobantes/historial',
    CREATE: '/panel/comprobantes/nuevo',
  },
};

// UI Constants
export const UI = {
  COLORS: {
    PRIMARY: '#2196f3',
    SECONDARY: '#ff6b35',
    SUCCESS: '#4CAF50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3',
    LIGHT: '#f8f9fa',
    DARK: '#333333',
  },
  BREAKPOINTS: {
    MOBILE: '768px',
    TABLET: '1024px',
    DESKTOP: '1200px',
  },
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem',
  },
};

// Business Constants
export const BUSINESS = {
  CURRENCY: {
    SYMBOL: '₲',
    CODE: 'PYG',
    NAME: 'Guaraní Paraguayo',
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
  VALIDATION: {
    MIN_PRICE: 1,
    MAX_PRICE: 999999999,
    MIN_STOCK: 0,
    MAX_STOCK: 999999,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Verifique su conexión a internet.',
  UNAUTHORIZED: 'No tiene permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION: 'Por favor verifique los datos ingresados.',
  GENERIC: 'Ha ocurrido un error inesperado. Intente nuevamente.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Producto creado exitosamente.',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente.',
  PRODUCT_DELETED: 'Producto eliminado exitosamente.',
  INVOICE_CREATED: 'Factura creada exitosamente.',
  RECEIPT_GENERATED: 'Comprobante generado exitosamente.',
};