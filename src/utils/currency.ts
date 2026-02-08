// Currency configuration and utilities
export const currencies = [
  { code: 'TRY', symbol: '₺', nameEn: 'Turkish Lira', nameTr: 'Türk Lirası' },
  { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameTr: 'ABD Doları' },
  { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameTr: 'İngiliz Sterlini' }
];

export const currencySymbols: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  GBP: '£'
};

export function getCurrencySymbol(): string {
  const savedCurrency = localStorage.getItem('currency') || 'TRY';
  return currencySymbols[savedCurrency] || '₺';
}

export function formatCurrency(amount: number): string {
  const symbol = getCurrencySymbol();
  return `${symbol}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
}
