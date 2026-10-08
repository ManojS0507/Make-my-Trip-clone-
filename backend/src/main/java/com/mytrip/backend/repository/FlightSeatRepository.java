package com.mytrip.backend.repository;

import com.mytrip.backend.entity.FlightSeat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlightSeatRepository extends JpaRepository<FlightSeat, Long> {
    List<FlightSeat> findByFlightIdOrderByRowNumberAscSeatColumnAsc(Long flightId);
    Optional<FlightSeat> findByFlightIdAndSeatNumber(Long flightId, String seatNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from FlightSeat s where s.id = :id")
    Optional<FlightSeat> findByIdForUpdate(@Param("id") Long id);
}