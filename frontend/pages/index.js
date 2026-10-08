import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatINR } from '../utils/currency';
import { hotelImageSource } from '../components/ListingImage';

export default function Home() {
  const [destination, setDestination] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');
  const router = useRouter();

  const cities = [
    'New York, USA',
    'London, UK',
    'Paris, France',
    'Tokyo, Japan',
    'Dubai, UAE',
    'Singapore',
    'Bangkok, Thailand',
    'Hong Kong',
    'Sydney, Australia',
    'Toronto, Canada',
    'Los Angeles, USA',
    'San Francisco, USA',
    'Chicago, USA',
    'Miami, USA',
    'Las Vegas, USA',
    'Amsterdam, Netherlands',
    'Rome, Italy',
    'Barcelona, Spain',
    'Madrid, Spain',
    'Berlin, Germany',
    'Vienna, Austria',
    'Prague, Czech Republic',
    'Stockholm, Sweden',
    'Zurich, Switzerland',
    'Dublin, Ireland',
    'Lisbon, Portugal',
    'Athens, Greece',
    'Istanbul, Turkey',
    'Mumbai, India',
    'Delhi, India',
    'Bangalore, India',
    'Goa, India'
  ];

  // Filter suggestions based on destination input
  useEffect(() => {
    if (destination.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = cities.filter(city =>
      city.toLowerCase().includes(destination.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
    setShowSuggestions(filtered.length > 0);
  }, [destination]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!destination.trim() || !checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setSearchError('Enter a destination and valid check-in and check-out dates to search.');
      return;
    }
    setSearchError('');
    const queryParams = new URLSearchParams();
    queryParams.append('destination', destination.trim());
    queryParams.append('checkIn', checkInDate);
    queryParams.append('checkOut', checkOutDate);
    queryParams.append('guests', guests);

    router.push(`/hotels?${queryParams.toString()}`);
  };

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const destinations = [
    { name: 'New York, USA', image: hotelImageSource(1), price: `From ${formatINR(32000)}/night` },
    { name: 'Mumbai, India', image: hotelImageSource(2), price: `From ${formatINR(32000)}/night` },
    { name: 'New Delhi, India', image: hotelImageSource(3), price: `From ${formatINR(32000)}/night` },
    { name: 'Bengaluru, India', image: hotelImageSource(5), price: `From ${formatINR(32000)}/night` },
    { name: 'Goa, India', image: hotelImageSource(6), price: `From ${formatINR(32000)}/night` }
  ];

  return (
    <>
      <Head>
        <title>MyTrip - Travel Booking Platform</title>
        <meta name="description" content="Book flights, hotels, and more with MyTrip" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-light">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-primary/90 to-secondary/90 text-white py-20">
          <div className="container">
            <h1 className="text-4xl font-bold mb-6 max-w-2xl">
              Discover Your Next Adventure
            </h1>
            <p className="text-xl mb-8 max-w-xl">
              Book flights, hotels, and experiences worldwide with confidence
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-4xl">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Destination</label>
                  <input
                    type="text"
                    required
                    placeholder="Where are you going?"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setSearchError(''); }}
                    className="input w-full"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map(city => (
                        <button
                          type="button"
                          key={city}
                          onClick={() => {
                            setDestination(city);
                            setSuggestions([]);
                            setShowSuggestions(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-black hover:bg-gray-100"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Check-in Date</label>
                  <input
                    type="date"
                    required
                    min={todayString}
                    value={checkInDate}
                    onChange={(e) => { setCheckInDate(e.target.value); setSearchError(''); }}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Check-out Date</label>
                  <input
                    type="date"
                    required
                    min={checkInDate || todayString}
                    value={checkOutDate}
                    onChange={(e) => { setCheckOutDate(e.target.value); setSearchError(''); }}
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
              </div>

              {searchError && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{searchError}</p>}
              <button type="submit" className="w-full btn-primary mt-4">
                Search Travel Options
              </button>
            </form>
          </div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-60 h-60 bg-white/20 rounded-full"></div>
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-white/10 rounded-full"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose MyTrip?</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="card p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Best Price Guarantee</h3>
                <p className="text-gray-600">
                  We match lower prices and refund the difference if you find a better deal elsewhere.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">24/7 Customer Support</h3>
                <p className="text-gray-600">
                  Our dedicated support team is available around the clock to assist you.
                </p>
              </div>

              <div className="card p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h10M3 6h18"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure & Easy Booking</h3>
                <p className="text-gray-600">
                  Book with confidence using our secure payment gateway and instant confirmations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Popular Destinations</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {destinations.map(destinationItem => (
                <Link
                  key={destinationItem.name}
                  href={`/hotels?destination=${encodeURIComponent(destinationItem.name)}`}
                  className="card block overflow-hidden transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <img src={destinationItem.image} alt={destinationItem.name} className="h-48 w-full object-cover"/>
                  <div className="p-4">
                    <h3 className="mb-2 text-xl font-semibold">{destinationItem.name}</h3>
                    <p className="text-gray-600">{destinationItem.price}</p>
                    <span className="mt-3 inline-block text-primary underline">Explore hotels</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16">
          <div className="container">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Book Your Next Trip?</h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto">
                Join millions of travelers who trust MyTrip for their travel needs.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}