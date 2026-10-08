import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatINR } from '../utils/currency';
import ListingImage from '../components/ListingImage';

export default function HotelsPage() {
  const router = useRouter();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    minPrice: 30000,
    maxPrice: 150000,
    rating: 0
  });

  const fetchHotels = useCallback(async () => {
    try {
      setLoading(true);
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
      const response = await axios.get(`${baseURL}/api/hotels`);
      const hotelsWithRooms = await Promise.all((response.data || []).map(async hotel => {
        const roomsResponse = await axios.get(`${baseURL}/api/rooms/hotel/${hotel.id}`);
        const rates = (roomsResponse.data || []).map(room => Number(room.pricePerNight)).filter(Number.isFinite);
        return {
          ...hotel,
          minRoomPrice: rates.length ? Math.min(...rates) : null,
          rooms: roomsResponse.data || []
        };
      }));
      setHotels(hotelsWithRooms);
      setError(null);
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError(`Failed to load hotels: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    setFilters(current => ({
      ...current,
      destination: typeof router.query.destination === 'string' ? router.query.destination : '',
      checkIn: typeof router.query.checkIn === 'string' ? router.query.checkIn : '',
      checkOut: typeof router.query.checkOut === 'string' ? router.query.checkOut : '',
      guests: Number(router.query.guests) > 0 ? Number(router.query.guests) : 1
    }));
    fetchHotels();
  }, [router.isReady, router.query.destination, router.query.checkIn, router.query.checkOut, router.query.guests, fetchHotels]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (filters.checkIn && filters.checkOut && filters.checkOut <= filters.checkIn) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    if (filters.destination.trim()) params.set('destination', filters.destination.trim());
    if (filters.checkIn) params.set('checkIn', filters.checkIn);
    if (filters.checkOut) params.set('checkOut', filters.checkOut);
    params.set('guests', String(filters.guests));
    router.push(`/hotels?${params.toString()}`);
  };

  const visibleHotels = hotels.filter(hotel => {
    const search = filters.destination.trim().toLowerCase();
    const matchesDestination = !search || [hotel.name, hotel.city, hotel.country, `${hotel.city}, ${hotel.country}`]
      .some(value => value?.toLowerCase().includes(search));
    const matchesRating = !filters.rating || Number(hotel.starRating) >= Number(filters.rating);
    const matchesPrice = hotel.minRoomPrice != null
      && hotel.minRoomPrice >= Number(filters.minPrice || 30000)
      && hotel.minRoomPrice <= Number(filters.maxPrice || 150000);
    return matchesDestination && matchesRating && matchesPrice;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading hotels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => fetchHotels()} className="btn-outline mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Hotels - MyTrip</title>
      </Head>

      <div className="min-h-screen bg-light">
        {/* Search Bar */}
        <section className="bg-gray-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSearch} className="space-y-6 md:space-y-0 md:grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-dark">Destination</label>
                <input
                  type="text"
                  placeholder="Enter city or hotel name"
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark">Check-in</label>
                <input
                  type="date"
                  value={filters.checkIn}
                  onChange={(e) => setFilters({...filters, checkIn: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark">Check-out</label>
                <input
                  type="date"
                  value={filters.checkOut}
                  onChange={(e) => setFilters({...filters, checkOut: e.target.value})}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark">Guests</label>
                <select
                  value={filters.guests}
                  onChange={(e) => setFilters({...filters, guests: parseInt(e.target.value)})}
                  className="input w-full"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                    <option key={g} value={g}>
                      {g} Guest{g === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark">Min Price (₹)</label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 30000})}
                      min="30000"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark">Max Price (₹)</label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 150000})}
                      min="30001"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-dark">Rating (★)</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => setFilters({...filters, rating: parseInt(e.target.value)})}
                      className="input w-full"
                    >
                      {[0, 1, 2, 3, 4, 5].map(r => (
                        <option key={r} value={r}>
                          {r === 0 ? 'Any rating' : `${r} Star${r > 1 ? 's' : ''}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full md:w-auto py-3 px-6">
                Search Hotels
              </button>
            </form>
          </div>
        </section>

        {/* Hotels Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark">Featured Hotels</h2>
              <p className="text-gray-600 mt-2">
                Discover amazing places to stay around the world
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleHotels.map(hotel => {
                const detailParams = new URLSearchParams();
                if (filters.checkIn) detailParams.set('checkIn', filters.checkIn);
                if (filters.checkOut) detailParams.set('checkOut', filters.checkOut);
                detailParams.set('guests', String(filters.guests));
                return <Link key={hotel.id} href={`/hotels/${hotel.id}?${detailParams.toString()}`} className="block hover:shadow-xl transition-shadow">
                  <div className="card">
                    <div className="relative h-48">
                      <ListingImage id={hotel.id} name={hotel.name} alt={hotel.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-primary/90 text-white px-2 py-1 rounded text-sm">
                        ⭐{hotel.starRating}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2 text-dark">{hotel.name}</h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">{hotel.description}</p>
                      <div className="flex items-center mb-2">
                        <span className="mr-2 text-primary font-medium">
                          {hotel.minRoomPrice == null ? 'Price unavailable' : `${formatINR(hotel.minRoomPrice)}/night`}
                        </span>
                        <span className="text-gray-500">{hotel.city}, {hotel.country}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {hotel.facilities.slice(0, 3).map(facility => (
                          <span key={facility} className="badge bg-gray-100 text-gray-800">
                            {facility}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>;
              })}

              {visibleHotels.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">No hotels match this destination. Try another city or browse all hotels.</p>
                  {filters.destination && <button type="button" className="mt-3 text-primary underline" onClick={() => {
                    setFilters(current => ({ ...current, destination: '' }));
                    router.push('/hotels');
                  }}>Browse all hotels</button>}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}