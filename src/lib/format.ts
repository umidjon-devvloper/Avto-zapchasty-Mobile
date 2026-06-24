export const formatPrice = (amount: number, currency = 'UZS') => {
  const cur = currency === 'UZS' ? "so'm" : currency;
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + cur;
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' });

// "Hozir", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin"...
export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Hozirgina';
  if (min < 60) return `${min} daq oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} kun oldin`;
  return formatDate(iso);
};
