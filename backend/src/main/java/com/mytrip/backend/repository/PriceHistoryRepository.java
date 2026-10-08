package com.mytrip.backend.repository;

import com.mytrip.backend.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    List<PriceHistory> findByHotelId(Long hotelId);
    List<PriceHistory> findByFlightId(Long flightId);
    List<PriceHistory> findTop30ByHotelIdOrderByEffectiveDateDesc(Long hotelId);
    List<PriceHistory> findTop30ByFlightIdOrderByEffectiveDateDesc(Long flightId);
    List<PriceHistory> findTop30ByRoomIdOrderByEffectiveDateDesc(Long roomId);
}