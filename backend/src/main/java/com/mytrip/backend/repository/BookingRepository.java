package com.mytrip.backend.repository;

import com.mytrip.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    Optional<Booking> findByBookingReference(String bookingReference);
    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);
    List<Booking> findByRefundStatus(Booking.RefundStatus refundStatus);

    @Query("select count(b) from Booking b where b.hotelRoom.id = :roomId " +
            "and b.status in :statuses and b.checkInDate < :checkOut and b.checkOutDate > :checkIn")
    long countOverlappingRoomBookings(@Param("roomId") Long roomId,
                                      @Param("checkIn") java.util.Date checkIn,
                                      @Param("checkOut") java.util.Date checkOut,
                                      @Param("statuses") List<Booking.BookingStatus> statuses);
}