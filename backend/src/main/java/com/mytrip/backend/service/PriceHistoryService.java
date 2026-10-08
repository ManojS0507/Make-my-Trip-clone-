package com.mytrip.backend.service;

import com.mytrip.backend.entity.*;
import com.mytrip.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.NumberFormat;
import java.util.Locale;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PriceHistoryService {

    private final PriceHistoryRepository priceHistoryRepository;
    private final FlightRepository flightRepository;
    private final HotelRepository hotelRepository;
    private final HotelRoomRepository hotelRoomRepository;
    private final UserRepository userRepository;
    private final PriceFreezeRepository priceFreezeRepository;

    @Transactional
    public Quote quote(PriceFreeze.TargetType type, Long targetId) {
        double base;
        double demand = 1;
        Flight flight = null;
        Hotel hotel = null;
        HotelRoom room = null;
        if (type == PriceFreeze.TargetType.FLIGHT) {
            flight = flightRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));
            base = flight.getPrice();
            double sold = 1.0 - (double) flight.getAvailableSeats() / Math.max(1, flight.getTotalSeats());
            demand = sold >= .75 ? 1.2 : sold >= .5 ? 1.1 : 1.0;
        } else if (type == PriceFreeze.TargetType.ROOM) {
            room = hotelRoomRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
            hotel = room.getHotel();
            base = room.getPricePerNight();
        } else {
            hotel = hotelRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found"));
            base = 32_000.0 + hotel.getStarRating() * 1_000.0;
        }
        Date targetDate = flight != null ? flight.getDepartureTime() : new Date();
        int month = targetDate.toInstant().atZone(java.time.ZoneId.systemDefault()).getMonthValue();
        double season = month == 7 || month == 12 ? 1.2 : 1.0;
        double current = Math.round(base * demand * season * 100.0) / 100.0;
        NumberFormat priceFormatter = NumberFormat.getCurrencyInstance(
                type == PriceFreeze.TargetType.FLIGHT ? Locale.US : Locale.forLanguageTag("en-IN"));
        String explanation = "Base " + priceFormatter.format(base) + "; demand adjustment +" + Math.round((demand - 1) * 100)
                + "%; seasonal adjustment +" + Math.round((season - 1) * 100) + "%";
        PriceHistory history = new PriceHistory();
        history.setHotel(hotel);
        history.setFlight(flight);
        history.setRoom(room);
        history.setTargetType(type);
        history.setTargetId(targetId);
        history.setPrice(current);
        history.setExplanation(explanation);
        history.setEffectiveDate(new Date());
        priceHistoryRepository.save(history);
        return new Quote(type, targetId, Math.round(base * 100.0) / 100.0, current, explanation, new Date());
    }

    @Transactional(readOnly = true)
    public List<PriceHistory> history(PriceFreeze.TargetType type, Long targetId) {
        return switch (type) {
            case HOTEL -> priceHistoryRepository.findTop30ByHotelIdOrderByEffectiveDateDesc(targetId);
            case FLIGHT -> priceHistoryRepository.findTop30ByFlightIdOrderByEffectiveDateDesc(targetId);
            case ROOM -> priceHistoryRepository.findTop30ByRoomIdOrderByEffectiveDateDesc(targetId);
        };
    }

    @Transactional
    public PriceFreeze freeze(String email, PriceFreeze.TargetType type, Long targetId, int minutes) {
        if (minutes < 1 || minutes > 1440) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price freeze must be 1-1440 minutes");
        }
        Quote quote = quote(type, targetId);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        PriceFreeze freeze = new PriceFreeze();
        freeze.setUser(user);
        freeze.setTargetType(type);
        freeze.setTargetId(targetId);
        freeze.setFrozenPrice(quote.currentPrice());
        freeze.setExpiresAt(new Date(System.currentTimeMillis() + minutes * 60_000L));
        return priceFreezeRepository.save(freeze);
    }

    @Transactional(readOnly = true)
    public List<PriceFreeze> activeFreezes(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return priceFreezeRepository.findByUserIdAndExpiresAtAfterOrderByExpiresAtAsc(user.getId(), new Date());
    }

    public PriceHistory createPriceHistory(PriceHistory history) {
        throw new ResponseStatusException(HttpStatus.METHOD_NOT_ALLOWED, "Price history is generated by the pricing service");
    }

    public PriceHistory getPriceHistoryById(Long id) {
        return priceHistoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Price history not found"));
    }

    public List<PriceHistory> getPriceHistoryByHotelId(Long id) {
        return priceHistoryRepository.findTop30ByHotelIdOrderByEffectiveDateDesc(id);
    }

    public List<PriceHistory> getPriceHistoryByFlightId(Long id) {
        return priceHistoryRepository.findTop30ByFlightIdOrderByEffectiveDateDesc(id);
    }

    public List<PriceHistory> getAllPriceHistory() {
        return priceHistoryRepository.findAll();
    }

    public record Quote(PriceFreeze.TargetType targetType, Long targetId, double basePrice,
                        double currentPrice, String explanation, Date recordedAt) {
    }
}
