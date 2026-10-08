package com.mytrip.backend.repository;

import com.mytrip.backend.entity.HotelRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HotelRoomRepository extends JpaRepository<HotelRoom, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from HotelRoom r where r.id = :id")
    Optional<HotelRoom> findByIdForUpdate(@Param("id") Long id);
}