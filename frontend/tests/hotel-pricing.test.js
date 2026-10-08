const test = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('./support');

test('all listed hotel room rates and live room quotes are above ₹30,000', async () => {
  const hotels = await request('/api/hotels');
  assert.ok(hotels.length > 0, 'at least one seeded hotel should exist');

  for (const hotel of hotels) {
    const rooms = await request(`/api/rooms/hotel/${hotel.id}`);
    assert.ok(rooms.length > 0, `${hotel.name} should have at least one room`);

    for (const room of rooms) {
      assert.ok(room.pricePerNight > 30000,
        `${hotel.name} ${room.roomType} nightly rate should exceed ₹30,000`);
      const quote = await request(`/api/price-history/quote?targetType=ROOM&targetId=${room.id}`);
      assert.ok(quote.basePrice > 30000, `${room.roomType} base quote should exceed ₹30,000`);
      assert.ok(quote.currentPrice > 30000, `${room.roomType} live quote should exceed ₹30,000`);
      assert.match(quote.explanation, /₹/, 'hotel room quotes should identify INR');
    }
  }
});
