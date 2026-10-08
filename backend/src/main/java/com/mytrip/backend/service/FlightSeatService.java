package com.mytrip.backend.service;

import com.mytrip.backend.entity.FlightSeat;
import com.mytrip.backend.repository.FlightSeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightSeatService {

    private final FlightSeatRepository flightSeatRepository;

    public FlightSeat createFlightSeat(FlightSeat seat) {
        return flightSeatRepository.save(seat);
    }

    public FlightSeat getFlightSeatById(Long id) {
        return flightSeatRepository.findById(id).orElseThrow(() -> new RuntimeException("Flight seat not found"));
    }

    public List<FlightSeat> getAllSeats() {
        return flightSeatRepository.findAll();
    }

    public List<FlightSeat> getSeatsByFlightId(Long flightId) {
        return flightSeatRepository.findAll().stream()
                .filter(seat -> seat.getFlight().getId().equals(flightId))
                .toList();
    }

    public FlightSeat updateFlightSeat(Long id, FlightSeat seatDetails) {
        FlightSeat seat = getFlightSeatById(id);
        seat.setFlight(seatDetails.getFlight());
        seat.setSeatNumber(seatDetails.getSeatNumber());
        seat.setSeatClass(seatDetails.getSeatClass());
        seat.setIsAvailable(seatDetails.getIsAvailable());
        seat.setPrice(seatDetails.getPrice());
        seat.setRowNumber(seatDetails.getRowNumber());
        seat.setSeatColumn(seatDetails.getSeatColumn());
        seat.setIsAisle(seatDetails.getIsAisle());
        seat.setIsWindow(seatDetails.getIsWindow());
        return flightSeatRepository.save(seat);
    }

    public void deleteFlightSeat(Long id) {
        FlightSeat seat = getFlightSeatById(id);
        flightSeatRepository.delete(seat);
    }
}