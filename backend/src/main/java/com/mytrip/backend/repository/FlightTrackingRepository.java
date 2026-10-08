package com.mytrip.backend.repository;

import com.mytrip.backend.entity.FlightTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlightTrackingRepository extends JpaRepository<FlightTracking, Long> {
    List<FlightTracking> findByUserId(Long userId);
    List<FlightTracking> findByFlightId(Long flightId);
    Optional<FlightTracking> findByUserIdAndFlightId(Long userId, Long flightId);
}
