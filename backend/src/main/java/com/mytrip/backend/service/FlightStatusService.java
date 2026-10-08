package com.mytrip.backend.service;

import com.mytrip.backend.entity.Flight;
import com.mytrip.backend.entity.FlightTracking;
import com.mytrip.backend.entity.Notification;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.repository.FlightRepository;
import com.mytrip.backend.repository.FlightTrackingRepository;
import com.mytrip.backend.repository.NotificationRepository;
import com.mytrip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightStatusService {

    private final FlightRepository flightRepository;
    private final FlightTrackingRepository trackingRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public FlightStatusView getStatus(Long flightId) {
        return view(getFlight(flightId));
    }

    @Transactional
    public FlightStatusView simulateNextUpdate(Long flightId) {
        Flight flight = getFlight(flightId);
        Flight.FlightStatus previous = flight.getStatus();
        Flight.FlightStatus next = switch (previous) {
            case ON_TIME -> Flight.FlightStatus.DELAYED;
            case DELAYED -> Flight.FlightStatus.BOARDING;
            case BOARDING -> Flight.FlightStatus.DEPARTED;
            case DEPARTED -> Flight.FlightStatus.ARRIVED;
            case ARRIVED, CANCELLED -> throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This flight has reached a final status");
        };
        flight.setStatus(next);
        if (next == Flight.FlightStatus.DELAYED) {
            flight.setDelayReason("Operational delay in the mock flight feed");
            flight.setEstimatedArrival(new Date(flight.getArrivalTime().getTime() + Duration.ofHours(1).toMillis()));
        } else {
            flight.setDelayReason(null);
            flight.setEstimatedArrival(flight.getArrivalTime());
        }
        flightRepository.save(flight);
        if (next == Flight.FlightStatus.DELAYED || next == Flight.FlightStatus.CANCELLED
                || (next == Flight.FlightStatus.BOARDING && previous == Flight.FlightStatus.DELAYED)) {
            notifyTrackedPassengers(flight);
        }
        return view(flight);
    }

    @Transactional
    public FlightStatusView track(String email, Long flightId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Flight flight = getFlight(flightId);
        if (trackingRepository.findByUserIdAndFlightId(user.getId(), flightId).isEmpty()) {
            FlightTracking tracking = new FlightTracking();
            tracking.setUser(user);
            tracking.setFlight(flight);
            trackingRepository.save(tracking);
        }
        return view(flight);
    }

    @Transactional
    public void untrack(String email, Long flightId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        FlightTracking tracking = trackingRepository.findByUserIdAndFlightId(user.getId(), flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tracked flight not found"));
        trackingRepository.delete(tracking);
    }

    @Transactional(readOnly = true)
    public List<FlightStatusView> getTrackedFlights(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return trackingRepository.findByUserId(user.getId()).stream()
                .map(tracking -> view(tracking.getFlight())).toList();
    }

    private void notifyTrackedPassengers(Flight flight) {
        String title = flight.getStatus() == Flight.FlightStatus.DELAYED ? "Flight delayed" : "Flight status updated";
        String message = flight.getFlightNumber() + " is now " + flight.getStatus()
                + (flight.getDelayReason() == null ? "" : ". " + flight.getDelayReason())
                + (flight.getEstimatedArrival() == null ? "" : ". Estimated arrival: " + flight.getEstimatedArrival());
        Notification.NotificationType type = flight.getStatus() == Flight.FlightStatus.CANCELLED
                ? Notification.NotificationType.FLIGHT_CANCELLED : Notification.NotificationType.FLIGHT_DELAY;
        for (FlightTracking tracking : trackingRepository.findByFlightId(flight.getId())) {
            Notification notification = new Notification();
            notification.setUser(tracking.getUser());
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setIsRead(false);
            notificationRepository.save(notification);
        }
    }

    private FlightStatusView view(Flight flight) {
        Date eta = flight.getEstimatedArrival() == null ? flight.getArrivalTime() : flight.getEstimatedArrival();
        return new FlightStatusView(flight.getId(), flight.getFlightNumber(), flight.getAirline(),
                flight.getStatus(), flight.getDelayReason(), flight.getDepartureTime(), flight.getArrivalTime(), eta);
    }

    private Flight getFlight(Long flightId) {
        return flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));
    }

    public record FlightStatusView(Long flightId, String flightNumber, String airline,
                                   Flight.FlightStatus status, String delayReason,
                                   Date scheduledDeparture, Date scheduledArrival, Date estimatedArrival) {
    }
}
