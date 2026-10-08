import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import PriceHistoryChart from '../../components/PriceHistoryChart';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
const cabinName = ['Economy', 'Premium Economy', 'Business', 'First Class'];

export default function FlightSeatPage() {
  const router = useRouter();
  const flightId = router.query.id;
  const [flight, setFlight] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [billingName, setBillingName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('DEMO_CARD');

  const load = useCallback(async () => {
    if (!flightId) return;
    try {
      const [flightResponse, seatResponse, quoteResponse, historyResponse] = await Promise.all([
        axios.get(`${apiBase}/api/flights/${flightId}`),
        axios.get(`${apiBase}/api/seats/flight/${flightId}`),
        axios.get(`${apiBase}/api/price-history/quote`, { params: { targetType: 'FLIGHT', targetId: flightId } }),
        axios.get(`${apiBase}/api/price-history/flight/${flightId}`)
      ]);
      setFlight(flightResponse.data);
      setSeats(seatResponse.data);
      setQuote(quoteResponse.data);
      setHistory(historyResponse.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load flight or seat availability.');
    }
  }, [flightId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!flightId) return undefined;
    const timer = window.setInterval(async () => {
      try {
        const [flightResponse, seatResponse] = await Promise.all([
          axios.get(`${apiBase}/api/flights/${flightId}/status`),
          axios.get(`${apiBase}/api/seats/flight/${flightId}`)
        ]);
        setFlight(current => current ? {
          ...current,
          status: flightResponse.data.status,
          delayReason: flightResponse.data.delayReason,
          estimatedArrival: flightResponse.data.estimatedArrival
        } : current);
        setSeats(seatResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not refresh flight availability.');
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [flightId]);

  const groupedSeats = useMemo(() => {
    const groups = new Map();
    seats.forEach(seat => groups.set(seat.rowNumber, [...(groups.get(seat.rowNumber) || []), seat]));
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  const choose = async seat => {
    if (!seat.isAvailable) return;
    setSelectedSeat(seat);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.put(`${apiBase}/api/recommendations/preferences`, { key: 'seat', value: `${cabinName[seat.seatClass]} ${seat.seatNumber}` }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Seat preference could not be saved.');
      }
    }
  };

  const track = async () => {
    try {
      await axios.post(`${apiBase}/api/flights/${flightId}/track`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Flight added to your tracked flights. Status changes will appear in My Bookings notifications.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Sign in to track this flight.');
    }
  };

  const freezePrice = async () => {
    try {
      const response = await axios.post(`${apiBase}/api/price-history/freezes`, {
        targetType: 'FLIGHT', targetId: Number(flightId), minutes: 60
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage(`Price locked at $${Number(response.data.frozenPrice).toFixed(2)} for one hour.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Sign in to freeze this price.');
    }
  };

  const bookSeat = async () => {
    if (!selectedSeat || !billingName.trim() || saving) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push({ pathname: '/login', query: { next: router.asPath } });
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await axios.post(`${apiBase}/api/bookings`, {
        type: 'FLIGHT', flightId: Number(flightId), flightSeatId: selectedSeat.id, passengerCount: 1, paymentMethod
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      router.push(`/booking-confirmation?id=${response.data.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not book this seat. It may have just been taken.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>{flight ? `${flight.flightNumber} seat selection` : 'Choose a seat'} - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/flights" className="text-primary">← Back to flights</Link>
          {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
          {message && <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">{message}</p>}
          {flight && <>
            <section className="my-6 rounded-xl bg-white p-6 shadow">
              <div className="flex flex-wrap justify-between gap-4">
                <div><h1 className="text-2xl font-bold">{flight.airline} {flight.flightNumber}</h1><p>{flight.departureAirport} → {flight.arrivalAirport}</p></div>
                <div className="text-right"><p className="text-lg font-semibold">{flight.status}</p><p className="text-sm">ETA {new Date(flight.estimatedArrival || flight.arrivalTime).toLocaleString()}</p></div>
              </div>
              {flight.delayReason && <p className="mt-3 text-amber-800">{flight.delayReason}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={track} className="btn-outline">Track this flight</button>
                <button onClick={freezePrice} className="btn-outline">Freeze price for 1 hour</button>
              </div>
            </section>
            <section className="grid gap-6 md:grid-cols-[1fr_300px]">
              <div className="rounded-xl bg-white p-6 shadow">
                <h2 className="text-xl font-semibold">Select a seat</h2>
                <p className="mb-5 text-sm text-gray-600">Unavailable seats are disabled. Premium seats include their surcharge in the total.</p>
                <div className="space-y-3">
                  {groupedSeats.map(([row, rowSeats]) => <div key={row} className="flex items-center gap-3">
                    <span className="w-6 text-right text-sm text-gray-500">{row}</span>
                    <div className="flex flex-1 justify-center gap-2">
                      {rowSeats.map(seat => {
                        const selected = selectedSeat?.id === seat.id;
                        const label = `${cabinName[seat.seatClass] || 'Economy'} ${seat.seatNumber}, ${seat.isAvailable ? 'available' : 'unavailable'}, extra $${Number(seat.price).toFixed(2)}`;
                        return <button key={seat.id} type="button" disabled={!seat.isAvailable} title={label}
                          aria-label={label} aria-pressed={selected} onClick={() => choose(seat)}
                          className={`h-10 w-10 rounded text-xs font-semibold ${selected ? 'bg-primary text-white' : seat.isAvailable ? seat.seatClass > 0 ? 'bg-amber-100 text-amber-900 hover:ring-2 hover:ring-primary' : 'bg-green-100 text-green-900 hover:ring-2 hover:ring-primary' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}>
                          {seat.seatNumber}
                        </button>;
                      })}
                    </div>
                  </div>)}
                </div>
                {!seats.length && <p className="mt-4 text-gray-500">No seats are currently available.</p>}
                <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-600"><span>🟩 Economy</span><span>🟨 Premium/Business</span><span>⬜ Unavailable</span></div>
              </div>
              <aside className="space-y-5">
                <div className="rounded-xl bg-white p-5 shadow">
                  <h2 className="font-semibold">Price transparency</h2>
                  {quote && <><p className="mt-2 text-2xl font-bold">${(Number(quote.currentPrice) + Number(selectedSeat?.price || 0)).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">Base fare plus selected seat fee</p><p className="mt-2 text-sm text-gray-600">{quote.explanation}</p></>}
                  {selectedSeat && <p className="mt-2 text-sm">{cabinName[selectedSeat.seatClass]} seat {selectedSeat.seatNumber}: +${Number(selectedSeat.price).toFixed(2)}</p>}
                  <button type="button" onClick={() => { setCheckoutOpen(true); setError(''); }} disabled={!selectedSeat} className="btn-primary mt-4 w-full">
                    Continue to secure checkout
                  </button>
                  {checkoutOpen && selectedSeat && <section className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4" aria-labelledby="flight-checkout-title">
                    <h3 id="flight-checkout-title" className="font-semibold">Secure checkout</h3>
                    <p className="mt-1 text-xs text-gray-600">Demo payment only — no real charge or card details are collected.</p>
                    <label className="mt-3 block text-sm font-medium">
                      Billing name
                      <input required autoComplete="name" value={billingName} onChange={event => setBillingName(event.target.value)} className="input mt-1 w-full" />
                    </label>
                    <fieldset className="mt-3">
                      <legend className="text-sm font-medium">Payment method</legend>
                      <label className="mt-2 flex items-center gap-2 text-sm">
                        <input type="radio" name="flight-payment-method" value="DEMO_CARD" checked={paymentMethod === 'DEMO_CARD'} onChange={event => setPaymentMethod(event.target.value)} />
                        Demo card
                      </label>
                      <label className="mt-2 flex items-center gap-2 text-sm">
                        <input type="radio" name="flight-payment-method" value="DEMO_UPI" checked={paymentMethod === 'DEMO_UPI'} onChange={event => setPaymentMethod(event.target.value)} />
                        Demo UPI
                      </label>
                    </fieldset>
                    <button type="button" onClick={bookSeat} disabled={saving || !billingName.trim()} className="btn-primary mt-4 w-full">
                      {saving ? 'Processing…' : `Pay $${(Number(quote?.currentPrice || 0) + Number(selectedSeat.price || 0)).toFixed(2)} and confirm booking`}
                    </button>
                  </section>}
                </div>
                <div className="rounded-xl bg-white p-5 shadow">
                  <h2 className="font-semibold">Recent price history</h2>
                  <PriceHistoryChart history={history} />
                  <div className="mt-3 space-y-2">{history.slice(0, 6).map(point => <p key={point.id} className="flex justify-between text-sm"><span>{new Date(point.effectiveDate).toLocaleDateString()}</span><strong>${Number(point.price).toFixed(2)}</strong></p>)}</div>
                </div>
              </aside>
            </section>
          </>}
        </div>
      </main>
    </>
  );
}
