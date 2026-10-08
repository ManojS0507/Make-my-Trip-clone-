const test = require('node:test');
const assert = require('node:assert/strict');
const { request, login, jsonHeaders } = require('./support');

test('review photo, reply, helpful vote, report, and moderator decision persist', async () => {
  const token = await login();
  const hotels = await request('/api/hotels');
  assert.ok(hotels.length, 'seed hotel should exist');
  const unauthorized = await request('/api/reviews', {
    expectedStatus: 403,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType: 'HOTEL', targetId: hotels[0].id, rating: 5, title: 'Unauthorized', comment: 'No token' })
  });
  assert.ok(unauthorized.status);

  const form = new FormData();
  form.append('photo', new Blob([Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lU8AAAAASUVORK5CYII=', 'base64'
  )], { type: 'image/png' }), 'review.png');
  const photo = await request('/api/reviews/photos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  assert.match(photo.url, /^\/api\/reviews\/photos\//);

  const uniqueTitle = `API test ${Date.now()}`;
  const review = await request('/api/reviews', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({
      targetType: 'HOTEL', targetId: hotels[0].id, rating: 5, title: uniqueTitle,
      comment: 'Automated end-to-end review validation.', images: [photo.url]
    })
  });
  await request(`/api/reviews/${review.id}/helpful`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  await request(`/api/reviews/${review.id}/replies`, {
    method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ comment: 'Automated reply.' })
  });
  await request(`/api/reviews/${review.id}/flag`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });

  const adminToken = await login(process.env.MYTRIP_ADMIN_EMAIL || 'admin@mytrip.com',
    process.env.MYTRIP_ADMIN_PASSWORD || 'admin123');
  const queue = await request('/api/reviews/moderation/flagged', { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.ok(queue.some(item => item.id === review.id));
  await request(`/api/reviews/${review.id}/moderate`, {
    method: 'PUT',
    headers: jsonHeaders(adminToken),
    body: JSON.stringify({ decision: 'APPROVE', notes: 'Automated moderation validation.' })
  });
  const visible = await request(`/api/reviews/hotel/${hotels[0].id}?sort=MOST_HELPFUL`);
  const saved = visible.find(item => item.id === review.id);
  assert.ok(saved, 'approved review should be public');
  assert.equal(saved.helpfulVotes, 1);
});
