package com.mytrip.backend.controller;

import com.mytrip.backend.entity.Flight;
import com.mytrip.backend.service.FlightService;
import com.mytrip.backend.service.FlightStatusService;
import com.mytrip.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flights")
@RequiredArgsConstructor
public class FlightController {

    private final FlightService flightService;
    private final FlightStatusService flightStatusService;

    @GetMapping
    public ResponseEntity<List<Flight>> getAllFlights() {
        return ResponseEntity.ok(flightService.getAllFlights());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlightById(@PathVariable Long id) {
        return ResponseEntity.ok(flightService.getFlightById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Flight> createFlight(@RequestBody Flight flight) {
        return ResponseEntity.ok(flightService.createFlight(flight));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Flight> updateFlight(@PathVariable Long id, @RequestBody Flight flightDetails) {
        return ResponseEntity.ok(flightService.updateFlight(id, flightDetails));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<?> getFlightSeats(@PathVariable Long id) {
        // This would typically call a flight seat service
        return ResponseEntity.ok(Map.of("message", "Flight seats endpoint"));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<FlightStatusService.FlightStatusView> getFlightStatus(@PathVariable Long id) {
        return ResponseEntity.ok(flightStatusService.getStatus(id));
    }

    @PostMapping("/{id}/status/simulate")
    public ResponseEntity<FlightStatusService.FlightStatusView> simulateStatus(@PathVariable Long id) {
        return ResponseEntity.ok(flightStatusService.simulateNextUpdate(id));
    }

    @PostMapping("/{id}/track")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FlightStatusService.FlightStatusView> trackFlight(
            @PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(flightStatusService.track(user.getEmail(), id));
    }

    @DeleteMapping("/{id}/track")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> untrackFlight(@PathVariable Long id, @AuthenticationPrincipal User user) {
        flightStatusService.untrack(user.getEmail(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tracked")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<FlightStatusService.FlightStatusView>> getTrackedFlights(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(flightStatusService.getTrackedFlights(user.getEmail()));
    }
}