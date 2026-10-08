package com.mytrip.backend.controller;

import com.mytrip.backend.entity.FlightSeat;
import com.mytrip.backend.service.FlightSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class FlightSeatController {

    private final FlightSeatService flightSeatService;

    @GetMapping
    public ResponseEntity<List<FlightSeat>> getAllSeats() {
        return ResponseEntity.ok(flightSeatService.getAllSeats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FlightSeat> getFlightSeatById(@PathVariable Long id) {
        return ResponseEntity.ok(flightSeatService.getFlightSeatById(id));
    }

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<List<FlightSeat>> getSeatsByFlightId(@PathVariable Long flightId) {
        return ResponseEntity.ok(flightSeatService.getSeatsByFlightId(flightId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightSeat> createFlightSeat(@RequestBody FlightSeat seat) {
        return ResponseEntity.ok(flightSeatService.createFlightSeat(seat));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FlightSeat> updateFlightSeat(@PathVariable Long id, @RequestBody FlightSeat seatDetails) {
        return ResponseEntity.ok(flightSeatService.updateFlightSeat(id, seatDetails));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlightSeat(@PathVariable Long id) {
        flightSeatService.deleteFlightSeat(id);
        return ResponseEntity.noContent().build();
    }
}