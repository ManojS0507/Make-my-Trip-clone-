export default function PriceHistoryChart({ history = [], currency = 'USD' }) {
  const formatPrice = value => new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
  const values = [...history].reverse().map(item => Number(item.price)).filter(Number.isFinite);
  if (values.length < 2) {
    return <p className="mt-2 text-sm text-gray-500">More quotes will build your price history graph.</p>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = 8 + (index / (values.length - 1)) * 224;
    const y = max === min ? 40 : 72 - ((value - min) / (max - min)) * 64;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="mt-3">
      <svg viewBox="0 0 240 80" role="img" aria-label={`Price history from ${formatPrice(min)} to ${formatPrice(max)}`} className="h-20 w-full">
        <title>Price history</title>
        <line x1="8" y1="74" x2="232" y2="74" stroke="#d1d5db" strokeWidth="1" />
        <polyline points={points} fill="none" stroke="#ff6b35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-xs text-gray-500"><span>Low {formatPrice(min)}</span><span>High {formatPrice(max)}</span></div>
    </div>
  );
}
