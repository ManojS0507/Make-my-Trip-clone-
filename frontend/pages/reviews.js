import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export default function ReviewsPage() {
  const router = useRouter();
  const hotelId = router.query.hotelId;
  const flightId = router.query.flightId;
  const targetType = hotelId ? 'HOTEL' : 'FLIGHT';
  const targetId = hotelId || flightId;
  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState('NEWEST');
  const [ratingFilter, setRatingFilter] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [reply, setReply] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!targetId) return;
    try {
      const response = await axios.get(`${apiBase}/api/reviews/${targetType.toLowerCase()}/${targetId}`, {
        params: { sort, ...(ratingFilter ? { rating: ratingFilter } : {}) }
      });
      const withReplies = await Promise.all(response.data.map(async review => {
        const replies = await axios.get(`${apiBase}/api/reviews/${review.id}/replies`);
        return { ...review, replies: replies.data };
      }));
      setReviews(withReplies);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load reviews.');
    }
  }, [targetId, targetType, sort, ratingFilter]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const tokenHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  const submitReview = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const images = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('photo', photo);
        const uploaded = await axios.post(`${apiBase}/api/reviews/photos`, formData, {
          headers: { ...tokenHeaders(), 'Content-Type': 'multipart/form-data' }
        });
        images.push(uploaded.data.url);
      }
      await axios.post(`${apiBase}/api/reviews`, { targetType, targetId: Number(targetId), rating, title, comment, images }, {
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' }
      });
      setTitle('');
      setComment('');
      setPhotos([]);
      setMessage('Your review is published.');
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Review submission failed. Sign in and try again.');
    } finally {
      setSaving(false);
    }
  };

  const actOnReview = async (path, body) => {
    try {
      await axios.post(`${apiBase}/api/reviews/${path}`, body || {}, { headers: tokenHeaders() });
      setMessage('Thanks for helping improve the review community.');
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This action failed. Sign in and try again.');
    }
  };

  const sendReply = async reviewId => {
    try {
      await axios.post(`${apiBase}/api/reviews/${reviewId}/replies`, { comment: reply[reviewId] || '' }, {
        headers: { ...tokenHeaders(), 'Content-Type': 'application/json' }
      });
      setReply({ ...reply, [reviewId]: '' });
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Reply failed. Sign in and try again.');
    }
  };

  const photoUrl = url => url?.startsWith('/') ? `${apiBase}${url}` : url;

  return (
    <>
      <Head><title>{targetType === 'HOTEL' ? 'Hotel' : 'Flight'} reviews - MyTrip</title></Head>
      <main className="min-h-screen bg-light px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Link href={hotelId ? `/hotels/${hotelId}` : '/flights'} className="text-primary">← Back</Link>
          <h1 className="mt-5 text-3xl font-bold">Traveler reviews</h1>
          <p className="text-gray-600">Ratings, photos, replies, and community moderation.</p>
          {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
          {message && <p role="status" className="mt-4 rounded bg-green-50 p-3 text-green-800">{message}</p>}
          <form onSubmit={submitReview} className="my-6 space-y-3 rounded-lg bg-white p-5 shadow">
            <h2 className="text-xl font-semibold">Write a review</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Rating
                <select value={rating} onChange={event => setRating(Number(event.target.value))} className="input mt-1 w-full">
                  {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              <label className="text-sm">Photos (JPEG, PNG, WebP; up to 5 MB each)
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => setPhotos(Array.from(event.target.files || []))} className="mt-2 block w-full" />
              </label>
            </div>
            <input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Review title" className="input w-full" />
            <textarea required maxLength={2000} rows={4} value={comment} onChange={event => setComment(event.target.value)} placeholder="Share details that could help another traveler" className="input w-full" />
            <button disabled={saving} className="btn-primary">{saving ? 'Publishing…' : 'Publish review'}</button>
          </form>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{reviews.length} reviews</h2>
            <div className="flex gap-3">
              <label className="text-sm">Sort by
                <select value={sort} onChange={event => setSort(event.target.value)} className="input ml-2">
                  <option value="MOST_HELPFUL">Most helpful</option><option value="NEWEST">Newest</option><option value="HIGHEST_RATED">Highest rated</option>
                </select>
              </label>
              <label className="text-sm">Rating
                <select value={ratingFilter} onChange={event => setRatingFilter(event.target.value)} className="input ml-2">
                  <option value="">Any</option>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} stars</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map(review => <article key={review.id} className="rounded-lg bg-white p-5 shadow">
              <div className="flex flex-wrap justify-between gap-2"><div><strong>{review.user?.firstName || 'Traveler'}</strong><p aria-label={`${review.rating} out of 5 stars`} className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p></div><time className="text-sm text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</time></div>
              <h3 className="mt-2 font-semibold">{review.title}</h3><p className="mt-1 whitespace-pre-wrap">{review.comment}</p>
              {!!review.images?.length && <div className="mt-3 flex gap-2 overflow-x-auto">{review.images.map(image => <img key={image} src={photoUrl(image)} alt="Traveler submitted" className="h-28 w-36 rounded object-cover" />)}</div>}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <button onClick={() => actOnReview(`${review.id}/helpful`)} className="text-primary">Helpful ({review.helpfulVotes})</button>
                <button onClick={() => actOnReview(`${review.id}/flag`)} className="text-red-700">Flag inappropriate</button>
              </div>
              <div className="mt-3 flex gap-2"><input value={reply[review.id] || ''} onChange={event => setReply({ ...reply, [review.id]: event.target.value })} placeholder="Reply to this review" className="input min-w-0 flex-1" maxLength={2000} /><button onClick={() => sendReply(review.id)} className="btn-outline">Reply</button></div>
              {(review.replies || []).map(item => <p key={item.id} className="ml-5 mt-2 border-l-2 pl-3 text-sm"><strong>{item.user?.firstName || 'Traveler'}:</strong> {item.comment}</p>)}
            </article>)}
            {!reviews.length && <p className="rounded bg-white p-5 text-gray-600">No reviews yet. Be the first to share your experience.</p>}
          </div>
        </div>
      </main>
    </>
  );
}
