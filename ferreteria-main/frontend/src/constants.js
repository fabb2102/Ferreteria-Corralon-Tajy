export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/panel',
  LOGIN: '/login',
  PANEL: '/panel',
  PRODUCTS: {
    LIST: '/panel/productos/listar',
    CREATE: '/panel/productos/ingresar'
  },
  CLIENTS: {
    LIST: '/panel/clientes/listar',
    CREATE: '/panel/clientes/nuevo'
  },
  INVOICES: {
    CREATE: '/panel/facturas/nueva',
    LIST: '/panel/facturas/historial'
  },
  RECEIPTS: {
    CREATE: '/panel/comprobantes/nuevo',
    LIST: '/panel/comprobantes/historial'
  },
  PROVIDERS: {
    LIST: '/panel/proveedores/listar'
  },
  PURCHASES: '/panel/compras',
  USERS: '/panel/usuarios'
};