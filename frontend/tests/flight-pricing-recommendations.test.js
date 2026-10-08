const test = require('node:test');
const assert = require('node:assert/strict');
const { request, registerTestUser, jsonHeaders } = require('./support');

test('traveler tracking, mock status notifications, price freeze, and recommendations work', async () => {
  const token = await registerTestUser();
  await request('/api/flights/tracked', { expectedStatus: 403 });
  const flights = await request('/api/flights');
  const flight = flights.find(item => item.status !== 'ARRIVED' && item.status !== 'CANCELLED');
  assert.ok(flight);

  await request(`/api/flights/${flight.id}/track`, {
    method: 'POST', headers: jsonHeaders(token), body: '{}'
  });
  const previous = await request(`/api/flights/${flight.id}/status`);
  let next = previous;
  if (previous.status === 'ON_TIME') {
    next = await request(`/api/flights/${flight.id}/status/simulate`, { method: 'POST' });
  }
  assert.ok(next.estimatedArrival, 'status includes an estimated arrival');
  const tracked = await request('/api/flights/tracked', { headers: { Authorization: `Bearer ${token}` } });
  assert.ok(tracked.some(item => item.flightId === flight.id), 'tracking is persisted');

  const quote = await request(`/api/price-history/quote?targetType=FLIGHT&targetId=${flight.id}`);
  assert.ok(quote.currentPrice > 0 && quote.explanation);
  const freeze = await request('/api/price-history/freezes', {
    method: 'POST', headers: jsonHeaders(token),
    body: JSON.stringify({ targetType: 'FLIGHT', targetId: flight.id, minutes: 30 })
  });
  assert.equal(freeze.frozenPrice, quote.currentPrice);
  const activeFreezes = await request('/api/price-history/freezes', { headers: { Authorization: `Bearer ${token}` } });
  assert.ok(activeFreezes.some(item => item.id === freeze.id));

  await request('/api/recommendations/preferences', {
    expectedStatus: 204,
    method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ key: 'destination', value: 'beaches' })
  });
  const recommendations = await request('/api/recommendations', { headers: { Authorization: `Bearer ${token}` } });
  assert.ok(recommendations.length);
  assert.ok(recommendations.every(item => item.reason));
  await request('/api/recommendations/feedback', {
    method: 'POST', headers: jsonHeaders(token),
    body: JSON.stringify({ targetType: recommendations[0].targetType, targetId: recommendations[0].targetId, helpful: false })
  });
});
