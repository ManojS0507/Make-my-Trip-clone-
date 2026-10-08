const hotelImageByName = {
  'Grand Palace Hotel': '/images/listings/hotel-1.jpg',
  'Taj Mahal Palace': '/images/listings/hotel-2.jpg',
  'The Oberoi': '/images/listings/hotel-3.jpg',
  'ITC Grand Bharat': '/images/listings/hotel-4.jpg',
  'The Leela Palace': '/images/listings/hotel-5.jpg',
  'Taj Exotica Resort & Spa': '/images/listings/hotel-6.jpg',
  'Hotel Sahara Star': '/images/listings/hotel-7.jpg',
  'Lemon Tree Premier': '/images/listings/hotel-8.jpg'
};

export function hotelImageSource(id, name) {
  return hotelImageByName[name] || (Number(id) >= 1 && Number(id) <= 8
    ? `/images/listings/hotel-${Number(id)}.jpg`
    : '/images/listings/hotel-1.jpg');
}

export default function ListingImage({ type = 'hotel', id, name, alt = '', className = '' }) {
  const src = type === 'flight' ? '/images/listings/flight-route.svg' : hotelImageSource(id, name);

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
