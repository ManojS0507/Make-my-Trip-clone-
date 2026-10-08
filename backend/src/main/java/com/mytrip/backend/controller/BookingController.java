package com.mytrip.backend.controller;

import com.mytrip.backend.entity.Booking;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Booking>> getUserBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getBookingsByUserId(user.getId()));
    }

    @GetMapping("/cancellation-policy")
    public ResponseEntity<Map<String, Object>> cancellationPolicy() {
        return ResponseEntity.ok(Map.of(
                "reasons", BookingService.cancellationReasons(),
                "rules", List.of(
                        Map.of("when", "Within 24 hours of booking and at least 24 hours before travel", "refundPercent", 50),
                        Map.of("when", "At least 7 days before travel", "refundPercent", 25),
                        Map.of("when", "Less than 7 days before travel or after travel", "refundPercent", 0)),
                "processingDays", 5,
                "note", "Refunds are calculated against the paid booking total. This demo simulates processing; no payment provider is connected."
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getOwnedBooking(id, user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody BookingRequest request,
                                                 @AuthenticationPrincipal User user) {
        Booking booking;
        if ("HOTEL".equalsIgnoreCase(request.type())) {
            if (request.hotelRoomId() == null || request.checkInDate() == null || request.checkOutDate() == null) {
                return ResponseEntity.badRequest().build();
            }
            booking = bookingService.createHotelBooking(user.getEmail(), request.hotelRoomId(),
                    request.checkInDate(), request.checkOutDate(),
                    request.passengerCount() == null ? 1 : request.passengerCount(), request.paymentMethod());
        } else if ("FLIGHT".equalsIgnoreCase(request.type())) {
            if (request.flightId() == null || request.flightSeatId() == null) {
                return ResponseEntity.badRequest().build();
            }
            booking = bookingService.createFlightBooking(user.getEmail(), request.flightId(), request.flightSeatId(),
                    request.paymentMethod());
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(booking);
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id,
                                                  @Valid @RequestBody CancellationRequest request,
                                                  @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, user.getId(), request.reason()));
    }

    @GetMapping("/{id}/refund-status")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> getRefundStatus(@PathVariable Long id,
                                                                @AuthenticationPrincipal User user) {
        Booking booking = bookingService.getOwnedBooking(id, user.getId());
        return ResponseEntity.ok(Map.of(
                "refundAmount", booking.getRefundAmount() == null ? 0 : booking.getRefundAmount(),
                "refundStatus", booking.getRefundStatus() == null ? Booking.RefundStatus.NONE : booking.getRefundStatus(),
                "expectedAt", booking.getRefundExpectedAt() == null ? "" : booking.getRefundExpectedAt().toInstant().toString(),
                "processedAt", booking.getRefundProcessedAt() == null ? "" : booking.getRefundProcessedAt().toInstant().toString(),
                "checkedAt", Instant.now().toString()
        ));
    }

    public record BookingRequest(String type, Long hotelRoomId, Long flightId, Long flightSeatId,
                                 java.time.LocalDate checkInDate, java.time.LocalDate checkOutDate,
                                 Integer passengerCount, String paymentMethod) {
    }

    public record CancellationRequest(@NotBlank String reason) {
    }
}
