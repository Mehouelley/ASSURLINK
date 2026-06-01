export function formatCurrencyXOF(amount: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR').format(amount) + ` ${currency}`;
}

export function formatDateFR(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

export function calculateNextYear(dateValue: string) {
  const date = new Date(dateValue);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}
