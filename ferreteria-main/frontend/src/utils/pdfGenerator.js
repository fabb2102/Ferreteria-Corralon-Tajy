import jsPDF from 'jspdf';

export const generateInvoicePDF = (ventaData) => {
  try {
    const doc = new jsPDF();
    
    let yPos = 20;
    
    // ===========================================
    // ENCABEZADO SIMPLE ESTILO TICKET
    // ===========================================
    
    // Nombre de la empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('FERRETERÍA CORRALÓN TAJY', 105, yPos, { align: 'center' });
    yPos += 8;
    
    // Datos básicos de la empresa
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Tel: (0981) 123-456', 105, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Asunción, Paraguay', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Línea separadora
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Título del comprobante
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('COMPROBANTE DE VENTA', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // ===========================================
    // INFORMACIÓN BÁSICA
    // ===========================================
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Número y fecha
    doc.text(`Comprobante N°: ${String(ventaData.id).padStart(6, '0')}`, 20, yPos);
    doc.text(`Fecha: ${new Date(ventaData.fecha || Date.now()).toLocaleDateString('es-PY')}`, 20, yPos + 8);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-PY', {hour: '2-digit', minute: '2-digit'})}`, 20, yPos + 16);
    yPos += 30;
    
    // Datos del cliente
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Manejar tanto formato string como objeto para cliente
    let clienteInfo = ventaData.cliente;
    if (typeof clienteInfo === 'object' && clienteInfo !== null) {
      doc.text(`${clienteInfo.nombre || 'Cliente General'}`, 20, yPos);
      yPos += 5;
      if (clienteInfo.telefono) {
        doc.text(`Tel: ${clienteInfo.telefono}`, 20, yPos);
        yPos += 5;
      }
      if (clienteInfo.direccion) {
        doc.text(`Dir: ${clienteInfo.direccion}`, 20, yPos);
        yPos += 5;
      }
    } else {
      doc.text(clienteInfo || 'Cliente General', 20, yPos);
      yPos += 5;
    }
    
    yPos += 10;
    
    // Línea separadora
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    // ===========================================
    // TABLA DE PRODUCTOS SIMPLE
    // ===========================================
    
    // Encabezado de la tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CANT', 20, yPos);
    doc.text('DESCRIPCIÓN', 40, yPos);
    doc.text('P.UNIT', 130, yPos);
    doc.text('TOTAL', 160, yPos);
    yPos += 5;
    
    // Línea bajo el header
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    // Productos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    let total = 0;
    let totalCantidad = 0;
    
    if (ventaData.productos && Array.isArray(ventaData.productos)) {
      ventaData.productos.forEach((producto, index) => {
        try {
          const cantidad = parseInt(producto.cantidad) || 0;
          const precio = parseFloat(producto.precio) || 0;
          const subtotal = producto.subtotal ? parseFloat(producto.subtotal) : cantidad * precio;
          total += subtotal;
          totalCantidad += cantidad;
          
          // Nombre del producto (máximo 45 caracteres)
          const nombre = String(producto.nombre || 'Producto').substring(0, 45);
          
          // Contenido de las columnas
          doc.text(cantidad.toString(), 20, yPos);
          doc.text(nombre, 40, yPos);
          doc.text(precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), 130, yPos);
          doc.text(subtotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."), 160, yPos);
          
          yPos += 10;
          
          // Manejar salto de página si es necesario
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
            
            // Redibujar header en nueva página
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('CANT', 20, yPos);
            doc.text('DESCRIPCIÓN', 40, yPos);
            doc.text('P.UNIT', 130, yPos);
            doc.text('TOTAL', 160, yPos);
            yPos += 8;
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
          }
        } catch (error) {
          console.warn('Error processing product:', producto, error);
        }
      });
    }
    
    yPos += 5;
    
    // Línea antes del total
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    // ===========================================
    // TOTALES
    // ===========================================
    
    // Total principal alineado con las columnas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL A PAGAR:', 20, yPos);
    const totalAmount = (ventaData.total || total);
    doc.text(`Gs ${totalAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`, 160, yPos);
    
    yPos += 20;
    
    // ===========================================
    // PIE DEL TICKET
    // ===========================================
    
    // Línea separadora
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    
    // Información del sistema
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleString('es-PY')}`, 105, yPos, { align: 'center' });
    
    return doc;
    
  } catch (error) {
    console.error('Error in generateInvoicePDF:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

export const downloadPDF = (doc, filename) => {
  try {
    if (!doc || typeof doc.save !== 'function') {
      throw new Error('Invalid PDF document object');
    }
    doc.save(filename);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error(`PDF download failed: ${error.message}`);
  }
};

export const generateAndDownloadInvoice = (ventaData) => {
  try {
    console.log('Generating PDF with data:', ventaData);
    
    // Validate required data
    if (!ventaData) {
      throw new Error('No data provided for PDF generation');
    }
    
    // Normalize the data structure - handle both 'productos' and 'detalles' formats
    let productos = [];
    if (ventaData.productos && Array.isArray(ventaData.productos)) {
      productos = ventaData.productos;
    } else if (ventaData.detalles && Array.isArray(ventaData.detalles)) {
      // Convert detalles format to productos format
      productos = ventaData.detalles.map(detalle => ({
        nombre: detalle.producto || detalle.nombre || 'Producto',
        cantidad: parseInt(detalle.cantidad) || 0,
        precio: parseFloat(detalle.precio_unitario) || parseFloat(detalle.precio) || 0,
        subtotal: parseFloat(detalle.subtotal) || 0
      }));
    }
    
    if (productos.length === 0) {
      throw new Error('No products found in the sale data');
    }
    
    // Create normalized data structure for PDF generation
    const normalizedData = {
      ...ventaData,
      productos: productos
    };
    
    console.log('Normalized data for PDF:', normalizedData);
    
    const doc = generateInvoicePDF(normalizedData);
    const filename = `comprobante-${String(ventaData.id || Date.now()).padStart(6, '0')}.pdf`;
    downloadPDF(doc, filename);
    
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('PDF generation failed with data:', ventaData);
    throw error;
  }
};