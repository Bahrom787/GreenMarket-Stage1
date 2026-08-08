// price/min_price/stock приходят строками (Decimal на бэке) — здесь единственное
// место, где Buyer MVP парсит их для отображения.

export function formatPrice(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`;
}

export function formatStock(stock: string, unit: string): string {
  const n = Number(stock);
  if (Number.isNaN(n)) return `${stock} ${unit}`;
  return `${n.toLocaleString('ru-RU', { maximumFractionDigits: 3 })} ${unit}`;
}

export function formatOfferCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = 'предложений';
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'предложение';
    else if (mod10 >= 2 && mod10 <= 4) word = 'предложения';
  }
  return `${count} ${word}`;
}
