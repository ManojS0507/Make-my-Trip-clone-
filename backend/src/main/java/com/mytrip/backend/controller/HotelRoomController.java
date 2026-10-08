package com.mytrip.backend.controller;

import com.mytrip.backend.entity.HotelRoom;
import com.mytrip.backend.service.HotelRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class HotelRoomController {

    private final HotelRoomService hotelRoomService;

    @GetMapping
    public ResponseEntity<List<HotelRoom>> getAllRooms() {
        return ResponseEntity.ok(hotelRoomService.getAllRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelRoom> getHotelRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(hotelRoomService.getHotelRoomById(id));
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<HotelRoom>> getRoomsByHotelId(@PathVariable Long hotelId) {
        return ResponseEntity.ok(hotelRoomService.getRoomsByHotelId(hotelId));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<HotelRoomService.RoomAvailability> availability(
            @PathVariable Long id, @RequestParam LocalDate checkIn, @RequestParam LocalDate checkOut) {
        return ResponseEntity.ok(hotelRoomService.availability(id, checkIn, checkOut));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HotelRoom> createHotelRoom(@RequestBody HotelRoom room) {
        return ResponseEntity.ok(hotelRoomService.createHotelRoom(room));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HotelRoom> updateHotelRoom(@PathVariable Long id, @RequestBody HotelRoom roomDetails) {
        return ResponseEntity.ok(hotelRoomService.updateHotelRoom(id, roomDetails));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteHotelRoom(@PathVariable Long id) {
        hotelRoomService.deleteHotelRoom(id);
        return ResponseEntity.noContent().build();
    }
}