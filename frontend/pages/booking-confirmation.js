import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatINR } from '../utils/currency';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !router.query.id) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push({ pathname: '/login', query: { next: router.asPath } });
      return;
    }
    axios.get(`${apiBase}/api/bookings/${router.query.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(response => setBooking(response.data)).catch(requestError => {
      setError(requestError.response?.data?.message || 'Could not load this booking confirmation.');
    });
  }, [router.isReady, router.query.id]);

  const title = booking?.bookingType === 'HOTEL'
    ? booking.hotel?.name || booking.hotelRoom?.roomType || 'Hotel stay'
    : `${booking?.flight?.airline || 'Flight'} ${booking?.flight?.flightNumber || ''}`;
  const formattedTotal = booking?.bookingType === 'HOTEL'
    ? formatINR(booking.totalAmount)
    : `$${Number(booking?.totalAmount || 0).toFixed(2)}`;

  return (
    <>
      <Head><title>Booking confirmation - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-12">
        <section className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">
          {error ? <div role="alert" className="rounded bg-red-50 p-4 text-red-700">{error}</div>
            : !booking ? <p role="status">Loading your confirmation…</p>
              : <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700" aria-hidden="true">✓</div>
                <h1 className="mt-4 text-3xl font-bold">Booking confirmed</h1>
                <p className="mt-2 text-gray-600">Your demo payment was recorded and your booking is confirmed.</p>
                <dl className="mt-8 grid gap-4 rounded-lg bg-gray-50 p-5 text-left sm:grid-cols-2">
                  <div><dt className="text-sm text-gray-500">Trip</dt><dd className="font-semibold">{title}</dd></div>
                  <div><dt className="text-sm text-gray-500">Booking reference</dt><dd className="font-semibold">{booking.bookingReference}</dd></div>
                  <div><dt className="text-sm text-gray-500">Booking type</dt><dd>{booking.bookingType}</dd></div>
                  <div><dt className="text-sm text-gray-500">Amount paid (demo)</dt><dd className="font-semibold">{formattedTotal}</dd></div>
                  <div><dt className="text-sm text-gray-500">Payment status</dt><dd>{booking.paymentStatus} · {booking.paymentMethod?.replace('DEMO_', '')}</dd></div>
                  <div><dt className="text-sm text-gray-500">Payment reference</dt><dd className="break-all">{booking.paymentReference}</dd></div>
                </dl>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/bookings" className="btn-primary">View my bookings</Link>
                  <Link href="/flights" className="btn-outline">Explore flights</Link>
                  <Link href="/hotels" className="btn-outline">Explore hotels</Link>
                </div>
              </div>}
        </section>
      </main>
    </>
  );
}
