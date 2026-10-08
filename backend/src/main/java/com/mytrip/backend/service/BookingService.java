package com.mytrip.backend.service;

import com.mytrip.backend.entity.*;
import com.mytrip.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Set<String> CANCELLATION_REASONS = Set.of(
            "CHANGE_OF_PLANS", "FOUND_BETTER_OPTION", "FLIGHT_CHANGE",
            "ILLNESS", "BOOKED_BY_MISTAKE", "OTHER");
    private static final long REFUND_WINDOW_MILLIS = Duration.ofHours(24).toMillis();
    private static final long REFUND_COMPLETION_MILLIS = Duration.ofDays(5).toMillis();

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final HotelRoomRepository hotelRoomRepository;
    private final FlightRepository flightRepository;
    private final FlightSeatRepository flightSeatRepository;
    private final PriceFreezeRepository priceFreezeRepository;
    private final PriceHistoryService priceHistoryService;

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdOrderByBookingDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public Booking getOwnedBooking(Long bookingId, Long userId) {
        Booking booking = getBookingById(bookingId);
        if (!booking.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        return booking;
    }

    @Transactional
    public Booking createHotelBooking(String email, Long roomId, LocalDate checkIn, LocalDate checkOut, int guests,
                                      String paymentMethod) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn) || guests < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose valid stay dates and guest count");
        }
        User user = findUser(email);
        HotelRoom room = hotelRoomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (guests > room.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guest count exceeds room capacity");
        }
        LocalDate availableFrom = room.getAvailableFrom() == null ? null : new Date(room.getAvailableFrom().getTime())
                .toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        LocalDate availableTo = room.getAvailableTo() == null ? null : new Date(room.getAvailableTo().getTime())
                .toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        if ((availableFrom != null && checkIn.isBefore(availableFrom))
                || (availableTo != null && checkOut.isAfter(availableTo))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is unavailable for the selected dates");
        }
        long reservedUnits = bookingRepository.countOverlappingRoomBookings(roomId, asDate(checkIn), asDate(checkOut),
                List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED));
        if (reservedUnits >= room.getInventoryCount()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No rooms of this type are available for the selected dates");
        }

        long nights = Duration.between(checkIn.atStartOfDay(), checkOut.atStartOfDay()).toDays();
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBookingReference(createBookingReference());
        booking.setBookingType(Booking.BookingType.HOTEL);
        booking.setHotel(room.getHotel());
        booking.setHotelRoom(room);
        booking.setCheckInDate(asDate(checkIn));
        booking.setCheckOutDate(asDate(checkOut));
        booking.setPassengerCount(guests);
        double nightlyRate = priceFreezeRepository.findFirstByUserIdAndTargetTypeAndTargetIdAndExpiresAtAfterOrderByExpiresAtDesc(
                        user.getId(), PriceFreeze.TargetType.ROOM, roomId, new Date())
                .map(PriceFreeze::getFrozenPrice)
                .orElseGet(() -> priceHistoryService.quote(PriceFreeze.TargetType.ROOM, roomId).currentPrice());
        booking.setTotalAmount(money(nightlyRate).multiply(BigDecimal.valueOf(nights)).doubleValue());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setRefundStatus(Booking.RefundStatus.NONE);
        applyMockPayment(booking, paymentMethod);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking createFlightBooking(String email, Long flightId, Long seatId, String paymentMethod) {
        User user = findUser(email);
        Flight flight = flightRepository.findByIdForUpdate(flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));
        FlightSeat seat = flightSeatRepository.findByIdForUpdate(seatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seat not found"));
        if (!seat.getFlight().getId().equals(flightId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected seat is not on this flight");
        }
        if (!Boolean.TRUE.equals(seat.getIsAvailable())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Selected seat is no longer available");
        }
        if (flight.getStatus() == Flight.FlightStatus.CANCELLED || flight.getStatus() == Flight.FlightStatus.ARRIVED
                || flight.getStatus() == Flight.FlightStatus.DEPARTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This flight is no longer accepting bookings");
        }
        if (flight.getAvailableSeats() == null || flight.getAvailableSeats() < 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No seats are currently available");
        }

        seat.setIsAvailable(false);
        flightSeatRepository.save(seat);
        flight.setAvailableSeats(Math.max(0, flight.getAvailableSeats() - 1));
        flightRepository.save(flight);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBookingReference(createBookingReference());
        booking.setBookingType(Booking.BookingType.FLIGHT);
        booking.setFlight(flight);
        booking.setFlightSeat(seat);
        booking.setPassengerCount(1);
        double flightPrice = priceFreezeRepository.findFirstByUserIdAndTargetTypeAndTargetIdAndExpiresAtAfterOrderByExpiresAtDesc(
                        user.getId(), PriceFreeze.TargetType.FLIGHT, flightId, new Date())
                .map(PriceFreeze::getFrozenPrice)
                .orElseGet(() -> priceHistoryService.quote(PriceFreeze.TargetType.FLIGHT, flightId).currentPrice());
        booking.setTotalAmount(money(flightPrice).add(money(seat.getPrice())).doubleValue());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setRefundStatus(Booking.RefundStatus.NONE);
        applyMockPayment(booking, paymentMethod);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Long id, Long userId, String reason) {
        if (reason == null || !CANCELLATION_REASONS.contains(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid cancellation reason");
        }
        Booking booking = getOwnedBooking(id, userId);
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking is already cancelled");
        }
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED
                && booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active bookings can be cancelled");
        }

        Date now = new Date();
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancellationDate(now);
        booking.setCancellationReason(reason);
        if (booking.getFlightSeat() != null) {
            booking.getFlightSeat().setIsAvailable(true);
            flightSeatRepository.save(booking.getFlightSeat());
            Flight flight = booking.getFlight();
            flight.setAvailableSeats(Math.min(flight.getTotalSeats(), flight.getAvailableSeats() + 1));
            flightRepository.save(flight);
        }

        double refundPercent = refundPercent(booking, now);
        double refund = money(booking.getTotalAmount())
                .multiply(BigDecimal.valueOf(refundPercent))
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
        booking.setRefundAmount(refund);
        booking.setRefundStatus(refund > 0 ? Booking.RefundStatus.PENDING : Booking.RefundStatus.NONE);
        booking.setRefundExpectedAt(refund > 0 ? new Date(now.getTime() + REFUND_COMPLETION_MILLIS) : null);
        return bookingRepository.save(booking);
    }

    @Transactional
    @Scheduled(fixedDelay = 60_000)
    public void advanceMockRefundProcessing() {
        Date now = new Date();
        for (Booking booking : bookingRepository.findByRefundStatus(Booking.RefundStatus.PENDING)) {
            booking.setRefundStatus(Booking.RefundStatus.PROCESSED);
            booking.setRefundProcessedAt(now);
            bookingRepository.save(booking);
        }
        for (Booking booking : bookingRepository.findByRefundStatus(Booking.RefundStatus.PROCESSED)) {
            if (booking.getRefundExpectedAt() != null && !booking.getRefundExpectedAt().after(now)) {
                booking.setRefundStatus(Booking.RefundStatus.COMPLETED);
                bookingRepository.save(booking);
            }
        }
    }

    public static List<String> cancellationReasons() {
        return List.of("CHANGE_OF_PLANS", "FOUND_BETTER_OPTION", "FLIGHT_CHANGE",
                "ILLNESS", "BOOKED_BY_MISTAKE", "OTHER");
    }

    private double refundPercent(Booking booking, Date now) {
        Date bookingDate = booking.getBookingDate();
        Date tripStart = booking.getBookingType() == Booking.BookingType.HOTEL
                ? booking.getCheckInDate()
                : booking.getFlight().getDepartureTime();
        long untilTrip = tripStart == null ? Long.MAX_VALUE : tripStart.getTime() - now.getTime();
        if (untilTrip <= 0) {
            return 0;
        }
        long age = bookingDate == null ? Long.MAX_VALUE : now.getTime() - bookingDate.getTime();
        if (age <= REFUND_WINDOW_MILLIS && untilTrip >= Duration.ofHours(24).toMillis()) {
            return 0.50;
        }
        if (untilTrip >= Duration.ofDays(7).toMillis()) {
            return 0.25;
        }
        return 0;
    }

    private void applyMockPayment(Booking booking, String method) {
        if (method == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a payment method");
        }
        try {
            booking.setPaymentMethod(Booking.PaymentMethod.valueOf(method.trim().toUpperCase()));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a supported demo payment method");
        }
        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        booking.setPaymentReference("DEMO-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        booking.setPaidAt(new Date());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private BigDecimal money(Double amount) {
        return BigDecimal.valueOf(amount == null ? 0 : amount).setScale(2, RoundingMode.HALF_UP);
    }

    private Date asDate(LocalDate date) {
        return Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    private String createBookingReference() {
        return "MYTRIP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }
}
