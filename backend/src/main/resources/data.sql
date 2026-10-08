-- Insert sample data for development

-- Sample Admin User
INSERT IGNORE INTO users (email)
VALUES ('admin@mytrip.com');

-- Sample Regular User
INSERT IGNORE INTO users (email)
VALUES ('user@example.com');

-- Sample Hotels
INSERT IGNORE INTO hotels (name, description, address, city, country, star_rating, created_at, updated_at)
VALUES
('Grand Palace Hotel', 'Luxury hotel in the heart of the city', '123 Main Street', 'New York', 'USA', 5, NOW(), NOW()),
('Taj Mahal Palace', 'Iconic luxury hotel facing the Arabian Sea', 'Apollo Bunder', 'Mumbai', 'India', 5, NOW(), NOW()),
('The Oberoi', 'Luxury hotel with exquisite gardens and pools', 'Dr. Zakir Hussain Marg', 'New Delhi', 'India', 5, NOW(), NOW()),
('ITC Grand Bharat', 'Luxury resort spa and golf destination', 'Sector 53, Gurgaon', 'Delhi NCR', 'India', 5, NOW(), NOW()),
('The Leela Palace', 'Royal heritage hotel with modern amenities', 'Old Airport Road', 'Bengaluru', 'India', 5, NOW(), NOW()),
('Taj Exotica Resort & Spa', 'Luxury beach resort on palm-fringed shores', 'Benaulim Beach', 'Goa', 'India', 5, NOW(), NOW()),
('Hotel Sahara Star', 'Modern hotel near domestic airport', 'Sahar Airport Road', 'Mumbai', 'India', 4, NOW(), NOW()),
('Lemon Tree Premier', 'Contemporary hotel in city center', 'Asset No. 6, Aerocity Hospitality District', 'Delhi', 'India', 4, NOW(), NOW());

-- Sample Hotel Facilities
INSERT IGNORE INTO hotel_facilities (hotel_id, facility) VALUES
-- Grand Palace Hotel (ID 1)
(1, 'WiFi'),
(1, 'Pool'),
(1, 'Spa'),
(1, 'Gym'),
(1, 'Restaurant'),
-- Taj Mahal Palace (ID 2)
(2, 'WiFi'),
(2, 'Pool'),
(2, 'Spa'),
(2, 'Gym'),
(2, 'Restaurant'),
(2, 'Bar'),
(2, 'Beach Access'),
-- The Oberoi (ID 3)
(3, 'WiFi'),
(3, 'Pool'),
(3, 'Spa'),
(3, 'Gym'),
(3, 'Restaurant'),
(3, 'Butler Service'),
(3, 'Gardens'),
-- ITC Grand Bharat (ID 4)
(4, 'WiFi'),
(4, 'Pool'),
(4, 'Spa'),
(4, 'Gym'),
(4, 'Restaurant'),
(4, 'Golf Course'),
(4, 'Tennis Court'),
-- The Leela Palace (ID 5)
(5, 'WiFi'),
(5, 'Pool'),
(5, 'Spa'),
(5, 'Gym'),
(5, 'Restaurant'),
(5, 'Butler Service'),
(5, 'Airport Shuttle'),
-- Taj Exotica Resort & Spa (ID 6)
(6, 'WiFi'),
(6, 'Pool'),
(6, 'Spa'),
(6, 'Gym'),
(6, 'Restaurant'),
(6, 'Butler Service'),
(6, 'Airport Shuttle'),
-- Hotel Sahara Star (ID 7)
(7, 'WiFi'),
(7, 'Pool'),
(7, 'Fitness Center'),
(7, 'Restaurant'),
(7, 'Bar'),
-- Lemon Tree Premier (ID 8)
(8, 'WiFi'),
(8, 'Fitness Center'),
(8, 'Restaurant'),
(8, 'Business Center');

-- Sample Hotel Images
INSERT IGNORE INTO hotel_images (hotel_id, image_url) VALUES
(1, '/images/listings/hotel-1.jpg'),
(2, '/images/listings/hotel-2.jpg'),
(3, '/images/listings/hotel-3.jpg'),
(4, '/images/listings/hotel-4.jpg'),
(5, '/images/listings/hotel-5.jpg'),
(6, '/images/listings/hotel-6.jpg'),
(7, '/images/listings/hotel-7.jpg'),
(8, '/images/listings/hotel-8.jpg');

-- Sample Hotel Rooms
INSERT IGNORE INTO hotel_rooms (hotel_id, room_type, description, price_per_night, capacity, amenities, images, available_from, available_to, created_at, updated_at)
VALUES
-- Grand Palace Hotel rooms (ID 1)
(1, 'Deluxe King', 'Spacious room with king size bed and city view', 32000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge"]', '["/images/listings/hotel-1.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(1, 'Executive Suite', 'Luxury suite with separate living area and premium amenities', 52000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge", "Espresso Machine"]', '["/images/listings/hotel-1.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- Taj Mahal Palace rooms (ID 2)
(2, 'Sea View Room', 'Elegant room with Arabian Sea view', 36000.00, 2, '["WiFi", "AC", "TV", "Mini Bar", "Sea View"]', '["/images/listings/hotel-2.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(2, 'Taj Club Room', 'Exclusive club room with lounge access', 45000.00, 2, '["WiFi", "AC", "TV", "Mini Bar", "Club Lounge Access"]', '["/images/listings/hotel-2.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- The Oberoi rooms (ID 3)
(3, 'Luxury Room', 'Sophisticated room with garden view', 32000.00, 2, '["WiFi", "AC", "TV", "Coffee Maker"]', '["/images/listings/hotel-3.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(3, 'Oberoi Suite', 'Opulent suite with butler service', 60000.00, 2, '["WiFi", "AC", "TV", "Coffee Maker", "Butler Service"]', '["/images/listings/hotel-3.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- ITC Grand Bharat rooms (ID 4)
(4, 'Garden View Room', 'Tranquil room overlooking landscaped gardens', 32000.00, 2, '["WiFi", "AC", "TV", "Tea/Coffee Maker"]', '["/images/listings/hotel-4.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(4, 'Deluxe Suite', 'Spacious suite with sitting area', 40000.00, 2, '["WiFi", "AC", "TV", "Tea/Coffee Maker", "Sitting Area"]', '["/images/listings/hotel-4.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- The Leela Palace rooms (ID 5)
(5, 'Deluxe Room', 'Elegant room with modern amenities', 32000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge"]', '["/images/listings/hotel-5.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(5, 'Leela Suite', 'Luxury suite with club lounge access', 45000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge", "Club Lounge Access"]', '["/images/listings/hotel-5.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- Taj Exotica Resort & Spa rooms (ID 6)
(6, 'Beachfront Villa', 'Private villa with direct beach access', 60000.00, 4, '["WiFi", "AC", "TV", "Kitchenette", "Private Pool"]', '["/images/listings/hotel-6.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(6, 'Garden Suite', 'Suite overlooking tropical gardens', 40000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge", "Garden View"]', '["/images/listings/hotel-6.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- Hotel Sahara Star rooms (ID 7)
(7, 'Comfort Room', 'Well-appointed room with modern amenities', 32000.00, 2, '["WiFi", "AC", "TV", "Tea/Coffee Maker"]', '["/images/listings/hotel-7.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(7, 'Business Room', 'Room optimized for business travelers', 32000.00, 2, '["WiFi", "AC", "TV", "Work Desk", "Ergonomic Chair"]', '["/images/listings/hotel-7.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
-- Lemon Tree Premier rooms (ID 8)
(8, 'Smart Room', 'Contemporary room with smart features', 32000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge"]', '["/images/listings/hotel-8.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW()),
(8, 'Premier Suite', 'Suite with separate living and sleeping areas', 32000.00, 2, '["WiFi", "AC", "TV", "Mini Fridge", "Sitting Area"]', '["/images/listings/hotel-8.jpg"]', '2026-01-01', '2026-12-31', NOW(), NOW());

-- Sample Flight
INSERT IGNORE INTO flights (flight_number, airline, departure_airport, arrival_airport, departure_time, arrival_time, duration, price, total_seats, available_seats, status, created_at, updated_at)
VALUES ('AA101', 'American Airlines', 'JFK', 'LAX', DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 7 HOUR), 300, 399.99, 180, 180, 'ON_TIME', NOW(), NOW());

-- Sample Flight Seats
INSERT IGNORE INTO flight_seats (flight_id, seat_number, seat_class, is_available, price, row_number, column, is_aisle, is_window)
VALUES (1, '1A', 'FIRST_CLASS', true, 599.99, 1, 'A', true, true),
       (1, '1B', 'FIRST_CLASS', true, 599.99, 1, 'B', false, false),
       (1, '2A', 'BUSINESS', true, 399.99, 2, 'A', true, true),
       (1, '2B', 'BUSINESS', true, 399.99, 2, 'B', false, false),
       (1, '3A', 'ECONOMY', true, 199.99, 3, 'A', true, true),
       (1, '3B', 'ECONOMY', true, 199.99, 3, 'B', false, false);

-- Sample Review
INSERT IGNORE INTO reviews (user_id, hotel_id, flight_id, booking_id, rating, title, comment, helpful_votes, total_votes, is_flagged, created_at, updated_at)
VALUES (2, 1, NULL, 1, 5, 'Excellent Stay', 'The hotel was amazing! Great service and comfortable rooms.', 10, 12, false, NOW(), NOW());

-- Sample Price History
INSERT IGNORE INTO price_history (hotel_id, flight_id, price, effective_date, created_at)
VALUES (1, NULL, 32000.00, NOW(), NOW()),
       (NULL, 1, 399.99, NOW(), NOW());