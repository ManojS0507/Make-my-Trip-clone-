import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ListingImage from '../components/ListingImage';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export default function FlightsPage() {
  const [flights, setFlights] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const loadFlights = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBase}/api/flights`);
      setFlights(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load flights.');
    }
  }, []);

  const loadTracked = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [response, notificationResponse] = await Promise.all([
        axios.get(`${apiBase}/api/flights/tracked`, { headers }),
        axios.get(`${apiBase}/api/notifications`, { headers })
      ]);
      setTracked(response.data);
      setNotifications(notificationResponse.data.filter(item => !item.isRead).slice(0, 5));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load tracked flights.');
    }
  }, []);

  useEffect(() => {
    loadFlights();
    if (typeof window === 'undefined') return undefined;
    loadTracked();
    const timer = window.setInterval(loadTracked, 20000);
    return () => window.clearInterval(timer);
  }, [loadFlights, loadTracked]);

  const visibleFlights = useMemo(() => flights.filter(flight =>
    flight.departureAirport.toLowerCase().includes(origin.toLowerCase())
    && flight.arrivalAirport.toLowerCase().includes(destination.toLowerCase())), [flights, origin, destination]);

  const trackFlight = async flightId => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.assign('/login');
      return;
    }
    try {
      await axios.post(`${apiBase}/api/flights/${flightId}/track`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadTracked();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not track flight.');
    }
  };

  const simulate = async flightId => {
    try {
      await axios.post(`${apiBase}/api/flights/${flightId}/status/simulate`);
      await Promise.all([loadFlights(), loadTracked()]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update flight status.');
    }
  };

  return (
    <>
      <Head><title>Flights - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-3xl font-bold">Find a flight</h1><p className="text-gray-600">Live mock status, seat selection, and transparent prices.</p></div>
            <div className="flex gap-3"><Link href="/bookings" className="btn-outline">My bookings</Link><Link href="/recommendations" className="btn-outline">For you</Link></div>
          </div>
          {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error} <button onClick={loadFlights} className="underline">Retry</button></p>}
          <div className="mb-6 grid gap-4 rounded-lg bg-white p-5 sm:grid-cols-2">
            <label className="text-sm">From airport
              <input value={origin} onChange={event => setOrigin(event.target.value)} placeholder="Any airport" className="input mt-1 w-full" />
            </label>
            <label className="text-sm">To airport
              <input value={destination} onChange={event => setDestination(event.target.value)} placeholder="Any destination" className="input mt-1 w-full" />
            </label>
          </div>
          {tracked.length > 0 && <section className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
            <h2 className="mb-3 text-xl font-semibold">Flights you are tracking</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {tracked.map(flight => <div key={flight.flightId} className="rounded bg-white p-4">
                <strong>{flight.flightNumber} · {flight.status}</strong>
                <p>{flight.scheduledDeparture} → {flight.scheduledArrival}</p>
                <p>Estimated arrival: {new Date(flight.estimatedArrival).toLocaleString()}</p>
                {flight.delayReason && <p className="text-amber-700">{flight.delayReason}</p>}
              </div>)}
            </div>
          </section>}
          {notifications.length > 0 && <section aria-live="polite" className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
            <h2 className="mb-2 text-lg font-semibold">Flight update notifications</h2>
            {notifications.map(notification => <p key={notification.id} className="py-1 text-sm"><strong>{notification.title}:</strong> {notification.message}</p>)}
          </section>}
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleFlights.map(flight => (
              <article key={flight.id} className="overflow-hidden rounded-lg bg-white shadow">
                <ListingImage type="flight" alt={`${flight.airline} flight`} className="h-44 w-full object-cover" />
                <div className="p-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <div><h2 className="text-xl font-semibold">{flight.airline} · {flight.flightNumber}</h2><p className="text-gray-600">{flight.departureAirport} → {flight.arrivalAirport}</p></div>
                  <span className={`h-fit rounded-full px-3 py-1 text-sm ${flight.status === 'DELAYED' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{flight.status}</span>
                </div>
                <div className="my-4 grid grid-cols-2 gap-3 text-sm">
                  <p>Departure<br /><strong>{new Date(flight.departureTime).toLocaleString()}</strong></p>
                  <p>Scheduled arrival<br /><strong>{new Date(flight.arrivalTime).toLocaleString()}</strong></p>
                  <p>Duration<br /><strong>{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</strong></p>
                  <p>Seats left<br /><strong>{flight.availableSeats} / {flight.totalSeats}</strong></p>
                </div>
                {flight.delayReason && <p className="mb-3 rounded bg-amber-50 p-3 text-sm text-amber-900">Delay: {flight.delayReason}. Revised ETA: {new Date(flight.estimatedArrival || flight.arrivalTime).toLocaleString()}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-xl font-bold text-primary">${Number(flight.price).toFixed(2)} <span className="text-sm font-normal text-gray-500">from</span></p>
                  <div className="flex gap-2">
                    <button onClick={() => trackFlight(flight.id)} className="btn-outline">Track</button>
                    <button onClick={() => simulate(flight.id)} className="btn-outline">Simulate update</button>
                    <Link href={`/flights/${flight.id}`} className="btn-primary">Choose seat</Link>
                  </div>
                </div>
                </div>
              </article>
            ))}
            {!visibleFlights.length && <p className="rounded bg-white p-5 text-gray-600">No flights match those airports.</p>}
          </div>
        </div>
      </main>
    </>
  );
}
