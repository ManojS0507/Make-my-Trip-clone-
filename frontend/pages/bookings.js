import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { formatINR } from '../utils/currency';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';
const reasons = [
  ['CHANGE_OF_PLANS', 'My plans changed'],
  ['FOUND_BETTER_OPTION', 'I found a better option'],
  ['FLIGHT_CHANGE', 'My flight changed'],
  ['ILLNESS', 'Illness or emergency'],
  ['BOOKED_BY_MISTAKE', 'Booked by mistake'],
  ['OTHER', 'Other']
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBookings = useCallback(async () => {
    const token = typeof window === 'undefined' ? '' : localStorage.getItem('token');
    if (!token) {
      setError('Sign in to view and manage your bookings.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsResponse, policyResponse] = await Promise.all([
        axios.get(`${apiBase}/api/bookings`, { headers }),
        axios.get(`${apiBase}/api/bookings/cancellation-policy`, { headers })
      ]);
      setBookings(bookingsResponse.data);
      setPolicy(policyResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    const timer = window.setInterval(loadBookings, 60000);
    return () => window.clearInterval(timer);
  }, [loadBookings]);

  const activeBookings = useMemo(() => bookings.filter(item => item.status !== 'CANCELLED'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter(item => item.status === 'CANCELLED'
    && Number(item.refundAmount) > 0 && item.refundStatus && item.refundStatus !== 'NONE'), [bookings]);

  const cancelBooking = async () => {
    if (!cancelTarget || !reason) return;
    setSaving(true);
    try {
      await axios.put(`${apiBase}/api/bookings/${cancelTarget.id}/cancel`, { reason }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCancelTarget(null);
      setReason('');
      await loadBookings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Cancellation failed. Refresh and try again.');
    } finally {
      setSaving(false);
    }
  };

  const titleFor = booking => booking.bookingType === 'HOTEL'
    ? booking.hotel?.name || booking.hotelRoom?.roomType || 'Hotel stay'
    : `${booking.flight?.airline || 'Flight'} ${booking.flight?.flightNumber || ''}`;
  const dateFor = booking => booking.bookingType === 'HOTEL'
    ? `${booking.checkInDate || ''} – ${booking.checkOutDate || ''}`
    : new Date(booking.flight?.departureTime || booking.bookingDate).toLocaleString();
  const formatBookingAmount = (booking, amount) => booking.bookingType === 'HOTEL'
    ? formatINR(amount)
    : `$${Number(amount || 0).toFixed(2)}`;

  return (
    <>
      <Head><title>My Bookings - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My bookings</h1>
              <p className="mt-1 text-gray-600">Manage trips and follow refund progress.</p>
            </div>
            <Link href="/flights" className="btn-primary">Explore trips</Link>
          </div>

          {error && <div role="alert" className="mb-5 rounded bg-red-50 p-4 text-red-700">
            {error} <Link href="/login" className="underline">Sign in</Link>
            <button className="ml-3 underline" onClick={loadBookings}>Retry</button>
          </div>}

          {loading ? <p role="status">Loading your bookings…</p> : (
            <>
              <h2 className="mb-4 text-xl font-semibold">Active and past bookings</h2>
              <div className="space-y-4">
                {activeBookings.map(booking => (
                  <article key={booking.id} className="rounded-lg bg-white p-5 shadow">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{titleFor(booking)}</h3>
                        <p className="text-gray-600">{booking.bookingType} · {dateFor(booking)}</p>
                        <p className="mt-1 text-sm text-gray-500">Reference: {booking.bookingReference} · {booking.passengerCount} traveler(s)</p>
                        {booking.paymentStatus && <p className="mt-1 text-sm text-gray-500">
                          Payment: {booking.paymentStatus} · {booking.paymentMethod?.replace('DEMO_', '')} · {booking.paymentReference}
                        </p>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatBookingAmount(booking, booking.totalAmount)}</p>
                        <span className="text-sm">{booking.status}</span>
                      </div>
                    </div>
                    {booking.status === 'CONFIRMED' && (
                      <button onClick={() => setCancelTarget(booking)} className="btn-outline mt-4">
                        Cancel booking
                      </button>
                    )}
                  </article>
                ))}
                {!activeBookings.length && <p className="rounded bg-white p-5 text-gray-600">No active or past bookings yet.</p>}
              </div>

              <section className="mt-10">
                <h2 className="mb-4 text-xl font-semibold">Cancelled bookings and refunds</h2>
                <div className="space-y-4">
                  {cancelledBookings.map(booking => (
                    <article key={booking.id} className="rounded-lg bg-white p-5 shadow">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{titleFor(booking)}</h3>
                          <p className="text-sm text-gray-600">{dateFor(booking)}</p>
                          <p className="mt-1 text-sm text-gray-600">Reason: {reasons.find(([value]) => value === booking.cancellationReason)?.[1] || booking.cancellationReason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatBookingAmount(booking, booking.refundAmount)} refund</p>
                          <p className="text-sm font-medium">{booking.refundStatus || 'NONE'}</p>
                          {booking.refundExpectedAt && <p className="text-sm text-gray-500">Expected by {new Date(booking.refundExpectedAt).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      {Number(booking.refundAmount || 0) > 0 && (
                        <ol className="mt-4 flex flex-wrap gap-2 text-xs">
                          {['PENDING', 'PROCESSED', 'COMPLETED'].map(step => (
                            <li key={step} aria-current={booking.refundStatus === step ? 'step' : undefined}
                              className={`rounded-full px-3 py-1 ${booking.refundStatus === step ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                    </article>
                  ))}
                  {!cancelledBookings.length && <p className="rounded bg-white p-5 text-gray-600">No refunds to track. Cancel a booking to see its refund status here.</p>}
                </div>
              </section>

              {policy && <section className="mt-10 rounded-lg bg-white p-5">
                <h2 className="text-lg font-semibold">Cancellation and refund policy</h2>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">
                  {policy.rules.map(rule => <li key={rule.when}>{rule.when}: {rule.refundPercent}% refund</li>)}
                </ul>
                <p className="mt-2 text-sm text-gray-600">Refunds are simulated and may take up to {policy.processingDays} days. {policy.note}</p>
              </section>}
            </>
          )}
        </div>
      </main>

      {cancelTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 id="cancel-title" className="text-xl font-semibold">Cancel this booking?</h2>
          <p className="mt-2 text-sm text-gray-600">The refund is calculated from the cancellation policy shown below. This cannot be undone.</p>
          <label htmlFor="cancel-reason" className="mt-4 block text-sm font-medium">Reason for cancellation</label>
          <select id="cancel-reason" value={reason} onChange={event => setReason(event.target.value)} className="input mt-1 w-full">
            <option value="">Select a reason</option>
            {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setCancelTarget(null)} className="btn-outline" disabled={saving}>Keep booking</button>
            <button onClick={cancelBooking} className="btn-primary" disabled={!reason || saving}>{saving ? 'Cancelling…' : 'Confirm cancellation'}</button>
          </div>
        </section>
      </div>}
    </>
  );
}
