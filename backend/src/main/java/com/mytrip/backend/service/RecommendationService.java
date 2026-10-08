package com.mytrip.backend.service;

import com.mytrip.backend.entity.*;
import com.mytrip.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final RecommendationFeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;

    @Transactional(readOnly = true)
    public List<Recommendation> getRecommendations(String email) {
        User user = getUser(email);
        List<Booking> history = bookingRepository.findByUserIdOrderByBookingDateDesc(user.getId());
        Map<String, Integer> interest = new HashMap<>();
        for (Booking booking : history) {
            if (booking.getHotel() != null) {
                interest.merge(booking.getHotel().getCity().toLowerCase(Locale.ROOT), 3, Integer::sum);
                interest.merge(booking.getHotel().getCountry().toLowerCase(Locale.ROOT), 1, Integer::sum);
            }
            if (booking.getFlight() != null) {
                interest.merge(booking.getFlight().getArrivalAirport().toLowerCase(Locale.ROOT), 2, Integer::sum);
            }
        }
        preferenceRepository.findByUserId(user.getId()).forEach(preference ->
                interest.merge(preference.getValue().toLowerCase(Locale.ROOT), 5, Integer::sum));

        Set<String> dismissed = new HashSet<>();
        feedbackRepository.findByUserIdAndHelpfulFalse(user.getId()).forEach(feedback ->
                dismissed.add(feedback.getTargetType() + ":" + feedback.getTargetId()));

        List<Recommendation> results = new ArrayList<>();
        for (Hotel hotel : hotelRepository.findAll()) {
            if (dismissed.contains("HOTEL:" + hotel.getId())) {
                continue;
            }
            String city = hotel.getCity().toLowerCase(Locale.ROOT);
            String country = hotel.getCountry().toLowerCase(Locale.ROOT);
            String why = interest.containsKey(city) ? "You previously booked a stay in " + hotel.getCity() + "."
                    : interest.containsKey(country) ? "You have shown interest in " + hotel.getCountry() + "."
                    : "A popular " + hotel.getStarRating() + "-star hotel selected for discovery.";
            results.add(new Recommendation("HOTEL", hotel.getId(), hotel.getName(),
                    hotel.getCity() + ", " + hotel.getCountry(), null, why,
                    hotel.getImages() == null || hotel.getImages().isEmpty() ? null : hotel.getImages().get(0)));
        }
        for (Flight flight : flightRepository.findAll()) {
            if (dismissed.contains("FLIGHT:" + flight.getId())) {
                continue;
            }
            String airport = flight.getArrivalAirport().toLowerCase(Locale.ROOT);
            String why = interest.containsKey(airport) ? "You have traveled to " + flight.getArrivalAirport() + " before."
                    : "A current flight option chosen based on availability and destination variety.";
            results.add(new Recommendation("FLIGHT", flight.getId(), flight.getFlightNumber(),
                    flight.getDepartureAirport() + " → " + flight.getArrivalAirport(),
                    flight.getPrice(), why, null));
        }
        results.sort((a, b) -> {
            int aScore = interestScore(a, interest);
            int bScore = interestScore(b, interest);
            return Integer.compare(bScore, aScore);
        });
        return results.stream().limit(8).toList();
    }

    @Transactional
    public void savePreference(String email, String key, String value) {
        if (key == null || !Set.of("destination", "seat", "room_type").contains(key)
                || value == null || value.isBlank() || value.length() > 250) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preference key or value is invalid");
        }
        User user = getUser(email);
        UserPreference preference = preferenceRepository.findByUserIdAndKey(user.getId(), key)
                .orElseGet(UserPreference::new);
        preference.setUser(user);
        preference.setKey(key);
        preference.setValue(value.trim());
        preference.setUpdatedAt(new Date());
        preferenceRepository.save(preference);
    }

    @Transactional(readOnly = true)
    public Map<String, String> getPreferences(String email) {
        User user = getUser(email);
        Map<String, String> values = new HashMap<>();
        preferenceRepository.findByUserId(user.getId()).forEach(item -> values.put(item.getKey(), item.getValue()));
        return values;
    }

    @Transactional
    public RecommendationFeedback feedback(String email, String type, Long id, boolean helpful) {
        if (!"HOTEL".equals(type) && !"FLIGHT".equals(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target type must be HOTEL or FLIGHT");
        }
        User user = getUser(email);
        RecommendationFeedback feedback = feedbackRepository
                .findByUserIdAndTargetTypeAndTargetId(user.getId(), type, id)
                .orElseGet(RecommendationFeedback::new);
        feedback.setUser(user);
        feedback.setTargetType(type);
        feedback.setTargetId(id);
        feedback.setHelpful(helpful);
        return feedbackRepository.save(feedback);
    }

    private int interestScore(Recommendation recommendation, Map<String, Integer> interest) {
        return interest.getOrDefault(recommendation.subtitle().toLowerCase(Locale.ROOT), 0)
                + interest.getOrDefault(recommendation.title().toLowerCase(Locale.ROOT), 0);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public record Recommendation(String targetType, Long targetId, String title, String subtitle,
                                 Double price, String reason, String image) {
    }
}
