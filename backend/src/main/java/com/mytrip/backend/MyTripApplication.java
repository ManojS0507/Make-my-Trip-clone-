package com.mytrip.backend;

import com.mytrip.backend.entity.Hotel;
import com.mytrip.backend.entity.HotelRoom;
import com.mytrip.backend.entity.Flight;
import com.mytrip.backend.entity.FlightSeat;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.repository.FlightRepository;
import com.mytrip.backend.repository.FlightSeatRepository;
import com.mytrip.backend.repository.HotelRepository;
import com.mytrip.backend.repository.HotelRoomRepository;
import com.mytrip.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.time.Duration;

@SpringBootApplication
@EnableScheduling
public class MyTripApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyTripApplication.class, args);
    }

    @Bean
    CommandLineRunner init(UserRepository userRepository,
                           HotelRepository hotelRepository,
                           HotelRoomRepository hotelRoomRepository,
                           FlightRepository flightRepository,
                           FlightSeatRepository flightSeatRepository,
                           @Value("${app.seed-demo-users:true}") boolean seedDemoUsers,
                           @Value("${app.initial-admin-email:}") String initialAdminEmail,
                           @Value("${app.initial-admin-password:}") String initialAdminPassword) {
        return args -> {
            System.out.println("Checking database for sample data...");
            long userCount = userRepository.count();
            long hotelCount = hotelRepository.count();
            System.out.println("User count: " + userCount);
            System.out.println("Hotel count: " + hotelCount);

            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            boolean dataInserted = false;

            // Seed local demo accounts only when explicitly enabled.
            if (userCount == 0) {
                if (seedDemoUsers) {
                    User admin = new User();
                    admin.setEmail("admin@mytrip.com");
                    admin.setPasswordHash(passwordEncoder.encode("admin123"));
                    admin.setFirstName("Admin");
                    admin.setLastName("User");
                    admin.setRole(User.Role.ADMIN);

                    User user = new User();
                    user.setEmail("user@example.com");
                    user.setPasswordHash(passwordEncoder.encode("password123"));
                    user.setFirstName("John");
                    user.setLastName("Doe");
                    user.setRole(User.Role.USER);

                    userRepository.saveAll(Arrays.asList(admin, user));
                    dataInserted = true;
                } else if (!initialAdminEmail.isBlank() && !initialAdminPassword.isBlank()) {
                    User admin = new User();
                    admin.setEmail(initialAdminEmail);
                    admin.setPasswordHash(passwordEncoder.encode(initialAdminPassword));
                    admin.setFirstName("Initial");
                    admin.setLastName("Admin");
                    admin.setRole(User.Role.ADMIN);
                    userRepository.save(admin);
                    System.out.println("Initial administrator account created.");
                } else {
                    System.out.println("Demo users are disabled and no initial administrator credentials were configured.");
                }
            } else {
                System.out.println("Users already exist, skipping user insertion.");
            }

            // Insert sample hotels if they don't exist
            if (hotelCount == 0) {
                System.out.println("No hotels found, inserting sample hotels...");

                // Create sample hotels
                Hotel grandPalace = new Hotel();
                grandPalace.setName("Grand Palace Hotel");
                grandPalace.setDescription("Luxury hotel in the heart of the city");
                grandPalace.setAddress("123 Main Street");
                grandPalace.setCity("New York");
                grandPalace.setCountry("USA");
                grandPalace.setStarRating(5);
                grandPalace.setFacilities(List.of("WiFi", "Pool", "Spa", "Gym", "Restaurant"));
                grandPalace.setImages(List.of(
                    "/images/listings/hotel-1.jpg"
                ));

                Hotel tajMahal = new Hotel();
                tajMahal.setName("Taj Mahal Palace");
                tajMahal.setDescription("Iconic luxury hotel facing the Arabian Sea");
                tajMahal.setAddress("Apollo Bunder");
                tajMahal.setCity("Mumbai");
                tajMahal.setCountry("India");
                tajMahal.setStarRating(5);
                tajMahal.setFacilities(List.of("WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Beach Access"));
                tajMahal.setImages(List.of(
                    "/images/listings/hotel-2.jpg"
                ));

                Hotel theOberoi = new Hotel();
                theOberoi.setName("The Oberoi");
                theOberoi.setDescription("Luxury hotel with exquisite gardens and pools");
                theOberoi.setAddress("Dr. Zakir Hussain Marg");
                theOberoi.setCity("New Delhi");
                theOberoi.setCountry("India");
                theOberoi.setStarRating(5);
                theOberoi.setFacilities(List.of("WiFi", "Pool", "Spa", "Gym", "Restaurant", "Butler Service", "Gardens"));
                theOberoi.setImages(List.of(
                    "/images/listings/hotel-3.jpg"
                ));

                Hotel leelaPalace = new Hotel();
                leelaPalace.setName("The Leela Palace");
                leelaPalace.setDescription("Royal heritage hotel with modern amenities");
                leelaPalace.setAddress("Old Airport Road");
                leelaPalace.setCity("Bengaluru");
                leelaPalace.setCountry("India");
                leelaPalace.setStarRating(5);
                leelaPalace.setFacilities(List.of("WiFi", "Pool", "Spa", "Gym", "Restaurant", "Butler Service", "Airport Shuttle"));
                leelaPalace.setImages(List.of(
                    "/images/listings/hotel-5.jpg"
                ));

                Hotel tajExotica = new Hotel();
                tajExotica.setName("Taj Exotica Resort & Spa");
                tajExotica.setDescription("Luxury beach resort on palm-fringed shores");
                tajExotica.setAddress("Benaulim Beach");
                tajExotica.setCity("Goa");
                tajExotica.setCountry("India");
                tajExotica.setStarRating(5);
                tajExotica.setFacilities(List.of("WiFi", "Pool", "Spa", "Gym", "Restaurant", "Beach Access", "Water Sports"));
                tajExotica.setImages(List.of(
                    "/images/listings/hotel-6.jpg"
                ));

                List<Hotel> hotels = Arrays.asList(grandPalace, tajMahal, theOberoi, leelaPalace, tajExotica);
                List<Hotel> savedHotels = hotelRepository.saveAll(hotels);
                System.out.println("Sample hotels inserted!");

                // Create sample hotel rooms
                System.out.println("Inserting sample hotel rooms...");
                for (Hotel hotel : savedHotels) {
                    HotelRoom deluxeKing = new HotelRoom();
                    deluxeKing.setHotel(hotel);
                    deluxeKing.setRoomType("Deluxe King");
                    deluxeKing.setDescription("Spacious room with king size bed and city view");
                    deluxeKing.setPricePerNight(32000.0);
                    deluxeKing.setCapacity(2);
                    deluxeKing.setInventoryCount(5);
                    deluxeKing.setAmenities(Arrays.asList("WiFi", "AC", "TV", "Mini Fridge"));
                    deluxeKing.setImages(Arrays.asList(hotel.getImages().get(0)));
                    deluxeKing.setAvailableFrom(new Date(2026 - 1900, 0, 1)); // Jan 1, 2026
                    deluxeKing.setAvailableTo(new Date(2026 - 1900, 11, 31)); // Dec 31, 2026

                    HotelRoom executiveSuite = new HotelRoom();
                    executiveSuite.setHotel(hotel);
                    executiveSuite.setRoomType("Executive Suite");
                    executiveSuite.setDescription("Luxury suite with separate living area and premium amenities");
                    executiveSuite.setPricePerNight(52000.0);
                    executiveSuite.setCapacity(2);
                    executiveSuite.setInventoryCount(2);
                    executiveSuite.setAmenities(Arrays.asList("WiFi", "AC", "TV", "Mini Fridge", "Espresso Machine"));
                    executiveSuite.setImages(Arrays.asList(hotel.getImages().get(0)));
                    executiveSuite.setAvailableFrom(new Date(2026 - 1900, 0, 1)); // Jan 1, 2026
                    executiveSuite.setAvailableTo(new Date(2026 - 1900, 11, 31)); // Dec 31, 2026

                    hotelRoomRepository.saveAll(Arrays.asList(deluxeKing, executiveSuite));
                }
                System.out.println("Sample hotel rooms inserted!");
                dataInserted = true;
            } else {
                System.out.println("Hotels already exist, skipping hotel insertion.");
            }

            if (flightRepository.count() == 0) {
                Date departure = Date.from(java.time.Instant.now().plus(Duration.ofDays(5)));
                Date arrival = Date.from(departure.toInstant().plus(Duration.ofHours(3)));
                List<Flight> sampleFlights = List.of(
                        sampleFlight("MT101", "MyTrip Air", "JFK", "LAX", departure, arrival, 249.99),
                        sampleFlight("MT205", "MyTrip Air", "LAX", "SFO",
                                Date.from(departure.toInstant().plus(Duration.ofHours(5))),
                                Date.from(arrival.toInstant().plus(Duration.ofHours(5))), 129.99));
                sampleFlights = flightRepository.saveAll(sampleFlights);
                List<FlightSeat> seats = new java.util.ArrayList<>();
                String[] columns = {"A", "B", "C", "D", "E", "F"};
                for (Flight flight : sampleFlights) {
                    for (int row = 1; row <= 12; row++) {
                        int seatClass = row <= 2 ? 2 : row <= 4 ? 1 : 0;
                        double surcharge = seatClass == 2 ? 199.99 : seatClass == 1 ? 59.99 : 0.0;
                        for (int column = 0; column < columns.length; column++) {
                            FlightSeat seat = new FlightSeat();
                            seat.setFlight(flight);
                            seat.setSeatNumber(row + columns[column]);
                            seat.setSeatClass(seatClass);
                            seat.setIsAvailable(true);
                            seat.setPrice(surcharge);
                            seat.setRowNumber(row);
                            seat.setSeatColumn(columns[column]);
                            seat.setIsAisle(column == 2 || column == 3);
                            seat.setIsWindow(column == 0 || column == 5);
                            seats.add(seat);
                        }
                    }
                    flight.setTotalSeats(72);
                    flight.setAvailableSeats(72);
                }
                flightRepository.saveAll(sampleFlights);
                flightSeatRepository.saveAll(seats);
                dataInserted = true;
                System.out.println("Sample flights and seat maps inserted!");
            }

            if (dataInserted) {
                System.out.println("Sample data insertion completed!");
            } else {
                System.out.println("Database already contains sample data, skipping initialization.");
            }
        };
    }

    private Flight sampleFlight(String number, String airline, String from, String to,
                                Date departure, Date arrival, double price) {
        Flight flight = new Flight();
        flight.setFlightNumber(number);
        flight.setAirline(airline);
        flight.setDepartureAirport(from);
        flight.setArrivalAirport(to);
        flight.setDepartureTime(departure);
        flight.setArrivalTime(arrival);
        flight.setEstimatedArrival(arrival);
        flight.setDuration((int) Duration.between(departure.toInstant(), arrival.toInstant()).toMinutes());
        flight.setPrice(price);
        flight.setTotalSeats(72);
        flight.setAvailableSeats(72);
        flight.setStatus(Flight.FlightStatus.ON_TIME);
        return flight;
    }
}