import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PriceHistoryChart from '../../components/PriceHistoryChart';
import { formatINR } from '../../utils/currency';
import ListingImage from '../../components/ListingImage';

export default function HotelDetailPage({ hotel: initialHotel, rooms: initialRooms }) {
  const router = useRouter();
  const hotelId = typeof router.query.id === 'string' ? router.query.id : undefined;

  const [hotel, setHotel] = useState(initialHotel || null);
  const [rooms, setRooms] = useState(initialRooms || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state for booking
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomQuote, setRoomQuote] = useState(null);
  const [roomPriceHistory, setRoomPriceHistory] = useState([]);
  const [roomAvailability, setRoomAvailability] = useState(null);
  const [notice, setNotice] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [billingName, setBillingName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('DEMO_CARD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.checkIn === 'string') setCheckInDate(router.query.checkIn);
    if (typeof router.query.checkOut === 'string') setCheckOutDate(router.query.checkOut);
    if (Number(router.query.guests) > 0) setGuests(Number(router.query.guests));
  }, [router.isReady, router.query.checkIn, router.query.checkOut, router.query.guests]);

  useEffect(() => {
    if (hotelId) {
      // Only fetch if we don't have data for this ID yet
      if (!hotel || String(hotel.id) !== hotelId) {
        fetchHotelDetails(hotelId);
      }
    }
  }, [hotelId, hotel?.id]);

  useEffect(() => {
    if (!selectedRoom) {
      setRoomQuote(null);
      setRoomPriceHistory([]);
      return;
    }
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
    Promise.all([
      axios.get(`${baseURL}/api/price-history/quote`, { params: { targetType: 'ROOM', targetId: selectedRoom } }),
      axios.get(`${baseURL}/api/price-history/room/${selectedRoom}`)
    ]).then(([quoteResponse, historyResponse]) => {
      setRoomQuote(quoteResponse.data);
      setRoomPriceHistory(historyResponse.data);
    }).catch((requestError) => {
      setNotice(requestError.response?.data?.message || 'Could not load room pricing.');
    });
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom || !checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
      setRoomAvailability(null);
      return undefined;
    }
    let active = true;
    const checkAvailability = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/rooms/${selectedRoom}/availability`, {
          params: { checkIn: checkInDate, checkOut: checkOutDate }
        });
        if (active) setRoomAvailability(response.data);
      } catch (requestError) {
        if (active) setNotice(requestError.response?.data?.message || 'Could not check room availability.');
      }
    };
    checkAvailability();
    const timer = window.setInterval(checkAvailability, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedRoom, checkInDate, checkOutDate]);

  const fetchHotelDetails = async (hotelId) => {
    try {
      setLoading(true);
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
      console.log(`Fetching hotel details for ID: ${hotelId}`); // Debug log
      const hotelResponse = await axios.get(`${baseURL}/api/hotels/${hotelId}`);
      console.log(`Received hotel data:`, hotelResponse.data); // Debug log
      const roomsResponse = await axios.get(`${baseURL}/api/rooms/hotel/${hotelId}`);
      console.log(`Received rooms data:`, roomsResponse.data); // Debug log
      setHotel(hotelResponse.data);
      setRooms(roomsResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching hotel details:', err); // Debug log
      setError(`Failed to load hotel details: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const handleDateChange = (type, date) => {
    if (type === 'checkIn') setCheckInDate(date);
    if (type === 'checkOut') setCheckOutDate(date);
  };

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateTotalPrice = () => {
    const room = rooms.find(item => item.id === selectedRoom);
    if (!room || !checkInDate || !checkOutDate) return 0;
    const nights = calculateNights();
    return Number(roomQuote?.currentPrice || room.pricePerNight) * nights;
  };

  const handleBookNow = async () => {
    if (!checkoutOpen) {
      if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
        setNotice('Choose a valid check-in and check-out date before continuing.');
        return;
      }
      setNotice('');
      setCheckoutOpen(true);
      return;
    }
    if (!billingName.trim()) {
      setNotice('Enter the billing name to continue.');
      return;
    }
    if (saving) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push({ pathname: '/login', query: { next: router.asPath } });
        return;
      }
      setSaving(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/bookings`, {
        type: 'HOTEL',
        hotelRoomId: selectedRoom,
        checkInDate,
        checkOutDate,
        passengerCount: guests,
        paymentMethod
      }, { headers: { Authorization: `Bearer ${token}` } });
      router.push(`/booking-confirmation?id=${response.data.id}`);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Booking failed. Please check the dates and try again.');
    } finally {
      setSaving(false);
    }
  };

  const freezeRoomPrice = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/price-history/freezes`, {
        targetType: 'ROOM', targetId: selectedRoom, minutes: 60
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNotice(`Room rate locked at ${formatINR(response.data.frozenPrice)} for one hour.`);
    } catch (err) {
      setNotice(err.response?.data?.message || 'Price could not be frozen.');
    }
  };

  const saveRoomPreference = async roomId => {
    setSelectedRoom(roomId);
    const room = rooms.find(item => item.id === roomId);
    const token = localStorage.getItem('token');
    if (token && room) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/recommendations/preferences`,
          { key: 'room_type', value: room.roomType },
          { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        setNotice(err.response?.data?.message || 'Room preference could not be saved.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => router.reload()} className="btn-outline mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Hotel not found</p>
          <button onClick={() => router.push('/hotels')} className="btn-outline mt-4">
            Back to Hotels
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{hotel.name} - MyTrip</title>
      </Head>

      <div className="min-h-screen bg-light">
        {notice && <div role="status" className="mx-auto mt-4 max-w-5xl rounded bg-blue-50 p-3 text-blue-800">{notice}</div>}
        {/* Back Button */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => router.push('/hotels')} className="text-primary hover:text-primary/80 flex items-center space-x-2">
            <span>←</span>
            Back to Hotels
          </button>
        </div>

        {/* Hotel Gallery */}
        <section className="pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {/* Hotel Images */}
              <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-lg">
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-white text-2xl">
                  {hotel.images.length} Photos
                </div>
                <ListingImage id={hotel.id} name={hotel.name} alt={hotel.name} className="w-full h-full object-cover" />
              </div>

              {/* Hotel Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{hotel.name}</h1>
                    <div className="flex items-center space-x-2 mt-2">
                      {[...Array(hotel.starRating)].map((_, index) => (
                        <span key={index} className="text-primary">⭐</span>
                      ))}
                      <span className="text-gray-500">({hotel.starRating})</span>
                    </div>
                    <p className="text-gray-600 mt-2">{hotel.address}, {hotel.city}, {hotel.country}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-primary">
                      From {formatINR(rooms.length ? Math.min(...rooms.map(room => room.pricePerNight)) : 0)}/night
                    </span>
                    <span className="text-sm text-gray-500">per night</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">About this Hotel</h2>
                  <p className="text-gray-700 line-clamp-4">{hotel.description}</p>
                </div>

                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Facilities</h2>
                  <div className="flex flex-wrap gap-2">
                    {hotel.facilities.map(facility => (
                      <span key={facility} className="badge bg-primary/10 text-primary">
                        {facility}
                      </span>
                    ))}
                  </div>
                  <Link href={`/reviews?hotelId=${hotel.id}`} className="text-primary underline">Read and write hotel reviews</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={`card ${selectedRoom === room.id ? 'border-2 border-primary' : ''} cursor-pointer hover:shadow-lg transition-all`}
                  onClick={() => saveRoomPreference(room.id)}
                >
                  <div className="relative h-48">
                    <ListingImage id={hotel.id} name={hotel.name} alt={`${room.roomType} at ${hotel.name}`} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-primary/90 text-white px-2 py-1 rounded text-sm">
                      ⭐{hotel.starRating}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{room.roomType}</h3>
                    <p className="text-gray-600 mb-2 line-clamp-3">{room.description}</p>
                    <div className="flex items-center mb-2">
                      <span className="mr-2 text-primary font-medium">{formatINR(room.pricePerNight)}/night</span>
                      <span className="text-gray-500">{room.capacity} guests</span>
                    </div>
                    <div className="flex flex-wrap gap-1 text-sm">
                      {(room.amenities || []).slice(0, 3).map(amenity => (
                        <span key={amenity} className="badge bg-gray-100 text-gray-800">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`mt-4 w-full ${selectedRoom === room.id ? 'btn-outline' : 'btn-primary'}`}
                      aria-pressed={selectedRoom === room.id}
                      onClick={event => { event.stopPropagation(); saveRoomPreference(room.id); }}
                    >
                      {selectedRoom === room.id ? 'Room selected' : 'Select this room'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Form */}
        {selectedRoom && (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-6">Book Your Stay</h2>

              <form onSubmit={event => event.preventDefault()} className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Check-in Date</label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => handleDateChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Check-out Date</label>
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => handleDateChange('checkOut', e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="input w-full"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                        <option key={g} value={g}>
                          {g} Guest{g === 1 ? '' : 's'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Room Details</label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-medium">🏨</span>
                      </div>
                      <div>
                        <p className="font-medium">{rooms.find(room => room.id === selectedRoom)?.roomType}</p>
                        <p className="text-sm text-gray-500">{rooms.find(room => room.id === selectedRoom)?.capacity} guests • {(rooms.find(room => room.id === selectedRoom)?.amenities || []).length} amenities</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="font-medium">Room preview</p>
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    <ListingImage id={hotel.id} name={hotel.name}
                      alt={`${rooms.find(room => room.id === selectedRoom)?.roomType || 'Room'} preview`}
                      className="h-24 w-36 rounded object-cover" />
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{roomQuote?.explanation}</p>
                  <PriceHistoryChart history={roomPriceHistory} currency="INR" />
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    {roomPriceHistory.slice(0, 5).map(point => <p key={point.id}>{new Date(point.effectiveDate).toLocaleDateString()} · {formatINR(point.price)}</p>)}
                  </div>
                  <button type="button" onClick={freezeRoomPrice} className="btn-outline mt-3">Freeze this price for 1 hour</button>
                </div>
                {roomAvailability && <p className="mt-3 text-sm font-medium text-green-800" role="status">
                  {roomAvailability.available} of {roomAvailability.inventory} rooms available for these dates (updates every 15 seconds).
                </p>}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Total Price</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatINR(calculateTotalPrice())}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBookNow}
                      className="btn-primary px-6 py-3"
                      disabled={!checkInDate || !checkOutDate || new Date(checkInDate) >= new Date(checkOutDate)
                        || roomAvailability?.available === 0}
                    >
                      Continue to secure checkout
                    </button>
                  </div>
                </div>
                {checkoutOpen && <section className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5" aria-labelledby="hotel-checkout-title">
                  <h3 id="hotel-checkout-title" className="text-lg font-semibold">Secure checkout</h3>
                  <p className="mt-1 text-sm text-gray-600">Demo payment only — no real charge or card details are collected.</p>
                  <label className="mt-4 block text-sm font-medium">
                    Billing name
                    <input required autoComplete="name" value={billingName} onChange={event => setBillingName(event.target.value)} className="input mt-1 w-full" />
                  </label>
                  <fieldset className="mt-4">
                    <legend className="text-sm font-medium">Payment method</legend>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input type="radio" name="hotel-payment-method" value="DEMO_CARD" checked={paymentMethod === 'DEMO_CARD'} onChange={event => setPaymentMethod(event.target.value)} />
                      Demo card
                    </label>
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input type="radio" name="hotel-payment-method" value="DEMO_UPI" checked={paymentMethod === 'DEMO_UPI'} onChange={event => setPaymentMethod(event.target.value)} />
                      Demo UPI
                    </label>
                  </fieldset>
                  <button type="button" onClick={handleBookNow} disabled={saving} className="btn-primary mt-5 w-full">
                    {saving ? 'Processing…' : `Pay ${formatINR(calculateTotalPrice())} and confirm booking`}
                  </button>
                </section>}
              </form>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { id } = params || {};

  if (!id) {
    return { notFound: true };
  }

  try {
    const baseURL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
    const hotelResponse = await axios.get(`${baseURL}/api/hotels/${id}`);
    const roomsResponse = await axios.get(`${baseURL}/api/rooms/hotel/${id}`);

    return {
      props: {
        hotel: hotelResponse.data,
        rooms: roomsResponse.data
      }
    };
  } catch (error) {
    console.error(`Error fetching data for hotel ${id}:`, error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { notFound: true };
    }
    throw error;
  }
}