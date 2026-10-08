import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import ListingImage from '../components/ListingImage';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export default function RecommendationsPage() {
  const [items, setItems] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sign in to see recommendations personalized to your trips.');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [recommendations, saved] = await Promise.all([
        axios.get(`${apiBase}/api/recommendations`, { headers }),
        axios.get(`${apiBase}/api/recommendations/preferences`, { headers })
      ]);
      setItems(recommendations.data);
      setPreferences(saved.data);
      setDestination(saved.data.destination || '');
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load recommendations.');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') load();
  }, [load]);

  const saveDestination = async event => {
    event.preventDefault();
    try {
      await axios.put(`${apiBase}/api/recommendations/preferences`, { key: 'destination', value: destination }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('Your travel interest was saved. Recommendations updated.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your interest.');
    }
  };

  const feedback = async (item, helpful) => {
    try {
      await axios.post(`${apiBase}/api/recommendations/feedback`, {
        targetType: item.targetType, targetId: item.targetId, helpful
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage(helpful ? 'Thanks! We will learn from this.' : 'We will show you fewer similar suggestions.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save feedback.');
    }
  };

  return (
    <>
      <Head><title>Recommended for you - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between"><div><h1 className="text-3xl font-bold">Recommended for you</h1><p className="text-gray-600">Suggestions based on your travel history and saved preferences.</p></div><Link href="/" className="text-primary">Home</Link></div>
          {error && <div role="alert" className="mb-4 rounded bg-amber-50 p-4 text-amber-900">{error} <Link href="/login" className="underline">Sign in</Link></div>}
          {message && <p role="status" className="mb-4 rounded bg-green-50 p-3 text-green-800">{message}</p>}
          <form onSubmit={saveDestination} className="mb-7 flex flex-wrap items-end gap-3 rounded-lg bg-white p-5">
            <label className="min-w-64 flex-1 text-sm">What kind of destination do you like?
              <input value={destination} onChange={event => setDestination(event.target.value)} placeholder="e.g. beaches, Bali, New York" className="input mt-1 w-full" maxLength={250} />
            </label>
            <button className="btn-primary">Save preference</button>
          </form>
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map(item => (
              <article key={`${item.targetType}-${item.targetId}`} className="overflow-hidden rounded-lg bg-white shadow">
                <ListingImage type={item.targetType === 'FLIGHT' ? 'flight' : 'hotel'}
                  id={item.targetId} name={item.title} alt={item.title}
                  className="h-44 w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.targetType}</p>
                  <h2 className="mt-1 text-lg font-semibold">{item.title}</h2><p className="text-gray-600">{item.subtitle}</p>
                  {item.price != null && <p className="mt-2 font-semibold">${Number(item.price).toFixed(2)} from</p>}
                  <details className="mt-3 text-sm"><summary className="cursor-pointer text-primary">Why this recommendation?</summary><p className="mt-2 text-gray-600">{item.reason}</p></details>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => feedback(item, true)} className="btn-outline text-sm">Helpful</button>
                    <button onClick={() => feedback(item, false)} className="btn-outline text-sm">Not for me</button>
                    <Link href={item.targetType === 'HOTEL' ? `/hotels/${item.targetId}` : `/flights/${item.targetId}`} className="btn-primary ml-auto text-sm">Explore</Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
          {!!preferences.seat && <p className="mt-8 text-sm text-gray-600">Saved seat preference: {preferences.seat}</p>}
        </div>
      </main>
    </>
  );
}
