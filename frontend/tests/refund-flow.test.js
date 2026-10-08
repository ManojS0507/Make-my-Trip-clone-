const test = require('node:test');
const assert = require('node:assert/strict');
const { request, registerTestUser, jsonHeaders } = require('./support');

test('authenticated traveler books and cancels a flight with persisted partial refund', async () => {
  const token = await registerTestUser();
  await request('/api/bookings', { expectedStatus: 403 });
  const flights = await request('/api/flights');
  const flight = flights.find(item => item.status !== 'CANCELLED' && item.status !== 'ARRIVED' && item.status !== 'DEPARTED');
  assert.ok(flight, 'a bookable seeded flight should exist');
  const seats = await request(`/api/seats/flight/${flight.id}`);
  const seat = seats.find(item => item.isAvailable);
  assert.ok(seat, 'an available seat should exist');

  await request('/api/bookings', {
    expectedStatus: 400,
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ type: 'FLIGHT', flightId: flight.id, flightSeatId: seat.id, paymentMethod: 'UNSUPPORTED' })
  });
  const seatsAfterDeclinedPayment = await request(`/api/seats/flight/${flight.id}`);
  assert.ok(seatsAfterDeclinedPayment.some(item => item.id === seat.id && item.isAvailable),
    'an invalid payment attempt must not reserve the seat');

  const booking = await request('/api/bookings', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ type: 'FLIGHT', flightId: flight.id, flightSeatId: seat.id, passengerCount: 1, paymentMethod: 'DEMO_CARD' })
  });
  assert.match(booking.bookingReference, /^MYTRIP-/);
  assert.equal(booking.paymentStatus, 'PAID');
  assert.equal(booking.paymentMethod, 'DEMO_CARD');
  assert.match(booking.paymentReference, /^DEMO-/);
  const cancelled = await request(`/api/bookings/${booking.id}/cancel`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ reason: 'CHANGE_OF_PLANS' })
  });
  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(cancelled.refundStatus, 'PENDING');
  assert.ok(Math.abs(cancelled.refundAmount - cancelled.totalAmount * 0.5) < 0.02);

  const persisted = await request(`/api/bookings/${booking.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(persisted.refundStatus, 'PENDING');
  assert.equal(persisted.cancellationReason, 'CHANGE_OF_PLANS');
  assert.equal(persisted.paymentStatus, 'PAID');
  assert.equal(persisted.paymentReference, booking.paymentReference);

  const hotels = await request('/api/hotels');
  const rooms = await request(`/api/rooms/hotel/${hotels[0].id}`);
  const room = rooms[0];
  const checkInDate = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
  const checkOutDate = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
  const availabilityPath = `/api/rooms/${room.id}/availability?checkIn=${checkInDate}&checkOut=${checkOutDate}`;
  const before = await request(availabilityPath);
  assert.ok(before.available > 0);
  const hotelBooking = await request('/api/bookings', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({
      type: 'HOTEL', hotelRoomId: room.id, checkInDate, checkOutDate, passengerCount: 1, paymentMethod: 'DEMO_UPI'
    })
  });
  assert.equal(hotelBooking.paymentStatus, 'PAID');
  assert.equal(hotelBooking.paymentMethod, 'DEMO_UPI');
  const occupied = await request(availabilityPath);
  assert.equal(occupied.available, before.available - 1);
  await request(`/api/bookings/${hotelBooking.id}/cancel`, {
    method: 'PUT', headers: jsonHeaders(token), body: JSON.stringify({ reason: 'BOOKED_BY_MISTAKE' })
  });
  const restored = await request(availabilityPath);
  assert.equal(restored.available, before.available);
});
