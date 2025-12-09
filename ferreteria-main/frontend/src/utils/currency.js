// Paraguayan Guarani currency formatting
export const formatCurrency = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₲S 0';
  }
  
  const numericAmount = parseFloat(amount);
  return `₲S ${numericAmount.toLocaleString('es-PY', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`;
};

export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  return parseFloat(currencyString.replace(/[₲S\s,]/g, '')) || 0;
};

export const CURRENCY_SYMBOL = '₲S';
export const CURRENCY_CODE = 'PYG';
export const CURRENCY_NAME = 'Guaraní Paraguayo';