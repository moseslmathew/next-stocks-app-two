export const formatCurrency = (value: number, currencyCode: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.error(`Error formatting currency ${currencyCode}:`, error);
    // Fallback to simpler formatting
    return `${currencyCode} ${value.toFixed(2)}`;
  }
};
