package com.mytrip.backend.controller;

import com.mytrip.backend.entity.PriceHistory;
import com.mytrip.backend.service.PriceHistoryService;
import com.mytrip.backend.entity.PriceFreeze;
import com.mytrip.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-history")
@RequiredArgsConstructor
public class PriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    @GetMapping
    public ResponseEntity<List<PriceHistory>> getAllPriceHistory() {
        return ResponseEntity.ok(priceHistoryService.getAllPriceHistory());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PriceHistory> getPriceHistoryById(@PathVariable Long id) {
        return ResponseEntity.ok(priceHistoryService.getPriceHistoryById(id));
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<PriceHistory>> getPriceHistoryByHotelId(@PathVariable Long hotelId) {
        return ResponseEntity.ok(priceHistoryService.getPriceHistoryByHotelId(hotelId));
    }

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<List<PriceHistory>> getPriceHistoryByFlightId(@PathVariable Long flightId) {
        return ResponseEntity.ok(priceHistoryService.getPriceHistoryByFlightId(flightId));
    }

    @PostMapping
    public ResponseEntity<PriceHistory> createPriceHistory(@RequestBody PriceHistory priceHistory) {
        return ResponseEntity.ok(priceHistoryService.createPriceHistory(priceHistory));
    }

    @GetMapping("/quote")
    public ResponseEntity<PriceHistoryService.Quote> quote(
            @RequestParam PriceFreeze.TargetType targetType, @RequestParam Long targetId) {
        return ResponseEntity.ok(priceHistoryService.quote(targetType, targetId));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<PriceHistory>> getRoomHistory(@PathVariable Long roomId) {
        return ResponseEntity.ok(priceHistoryService.history(PriceFreeze.TargetType.ROOM, roomId));
    }

    @PostMapping("/freezes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PriceFreeze> freeze(@AuthenticationPrincipal User user,
                                               @RequestBody FreezeRequest request) {
        return ResponseEntity.ok(priceHistoryService.freeze(user.getEmail(), request.targetType(),
                request.targetId(), request.minutes()));
    }

    @GetMapping("/freezes")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<PriceFreeze>> getFreezes(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(priceHistoryService.activeFreezes(user.getEmail()));
    }

    public record FreezeRequest(PriceFreeze.TargetType targetType, Long targetId, int minutes) {
    }
}