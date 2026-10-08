package com.mytrip.backend.service;

import com.mytrip.backend.entity.HotelRoom;
import com.mytrip.backend.repository.HotelRoomRepository;
import com.mytrip.backend.repository.BookingRepository;
import com.mytrip.backend.entity.Booking;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HotelRoomService {

    private static final double MINIMUM_NIGHTLY_RATE_INR = 30_000.0;

    private final HotelRoomRepository hotelRoomRepository;
    private final BookingRepository bookingRepository;

    public HotelRoom createHotelRoom(HotelRoom room) {
        if (room.getCapacity() == null || room.getCapacity() < 1 || room.getInventoryCount() < 0
                || room.getPricePerNight() == null || room.getPricePerNight() <= MINIMUM_NIGHTLY_RATE_INR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Room nightly rate must be greater than ₹30,000; capacity and inventory must also be valid");
        }
        return hotelRoomRepository.save(room);
    }

    public HotelRoom getHotelRoomById(Long id) {
        return hotelRoomRepository.findById(id).orElseThrow(() -> new RuntimeException("Hotel room not found"));
    }

    public List<HotelRoom> getAllRooms() {
        return hotelRoomRepository.findAll();
    }

    public List<HotelRoom> getRoomsByHotelId(Long hotelId) {
        return hotelRoomRepository.findAll().stream()
                .filter(room -> room.getHotel().getId().equals(hotelId))
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomAvailability availability(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose valid check-in and check-out dates");
        }
        HotelRoom room = getHotelRoomById(roomId);
        LocalDate availableFrom = room.getAvailableFrom() == null ? null : LocalDate.ofInstant(
                new Date(room.getAvailableFrom().getTime()).toInstant(), ZoneId.systemDefault());
        LocalDate availableTo = room.getAvailableTo() == null ? null : LocalDate.ofInstant(
                new Date(room.getAvailableTo().getTime()).toInstant(), ZoneId.systemDefault());
        if ((availableFrom != null && checkIn.isBefore(availableFrom))
                || (availableTo != null && checkOut.isAfter(availableTo))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is unavailable for the selected dates");
        }
        Date start = Date.from(checkIn.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date end = Date.from(checkOut.atStartOfDay(ZoneId.systemDefault()).toInstant());
        long reserved = bookingRepository.countOverlappingRoomBookings(roomId, start, end,
                List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED));
        int inventory = room.getInventoryCount();
        return new RoomAvailability(roomId, inventory, Math.max(0, inventory - (int) reserved),
                checkIn, checkOut);
    }

    public HotelRoom updateHotelRoom(Long id, HotelRoom roomDetails) {
        if (roomDetails.getCapacity() == null || roomDetails.getInventoryCount() < 0 || roomDetails.getCapacity() < 1
                || roomDetails.getPricePerNight() == null
                || roomDetails.getPricePerNight() <= MINIMUM_NIGHTLY_RATE_INR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Room nightly rate must be greater than ₹30,000; capacity and inventory must also be valid");
        }
        HotelRoom room = getHotelRoomById(id);
        room.setHotel(roomDetails.getHotel());
        room.setRoomType(roomDetails.getRoomType());
        room.setDescription(roomDetails.getDescription());
        room.setPricePerNight(roomDetails.getPricePerNight());
        room.setCapacity(roomDetails.getCapacity());
        room.setInventoryCount(roomDetails.getInventoryCount());
        room.setAmenities(roomDetails.getAmenities());
        room.setImages(roomDetails.getImages());
        room.setAvailableFrom(roomDetails.getAvailableFrom());
        room.setAvailableTo(roomDetails.getAvailableTo());
        return hotelRoomRepository.save(room);
    }

    public void deleteHotelRoom(Long id) {
        HotelRoom room = getHotelRoomById(id);
        hotelRoomRepository.delete(room);
    }

    public record RoomAvailability(Long roomId, int inventory, int available, LocalDate checkIn, LocalDate checkOut) {
    }
}