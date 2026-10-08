package com.mytrip.backend.service;

import com.mytrip.backend.entity.Booking;
import com.mytrip.backend.entity.HotelRoom;
import com.mytrip.backend.entity.PriceFreeze;
import com.mytrip.backend.entity.PriceHistory;
import com.mytrip.backend.repository.BookingRepository;
import com.mytrip.backend.repository.HotelRoomRepository;
import com.mytrip.backend.repository.PriceFreezeRepository;
import com.mytrip.backend.repository.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class HotelPricingMigration implements ApplicationRunner {

    private static final double MINIMUM_NIGHTLY_RATE_INR = 32_000.0;

    private final HotelRoomRepository hotelRoomRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final PriceFreezeRepository priceFreezeRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        hotelRoomRepository.findAll().forEach(room -> {
            Double price = room.getPricePerNight();
            if (price != null && price <= 30_000.0) {
                room.setPricePerNight(toRupeesAtLeastMinimum(price));
            }
        });

        priceHistoryRepository.findAll().forEach(history -> {
            if (isHotelPrice(history) && history.getPrice() != null && history.getPrice() <= 30_000.0) {
                history.setPrice(toRupeesAtLeastMinimum(history.getPrice()));
            }
        });

        priceFreezeRepository.findAll().forEach(freeze -> {
            if (freeze.getTargetType() != PriceFreeze.TargetType.FLIGHT
                    && freeze.getFrozenPrice() != null && freeze.getFrozenPrice() <= 30_000.0) {
                freeze.setFrozenPrice(toRupeesAtLeastMinimum(freeze.getFrozenPrice()));
            }
        });

        bookingRepository.findAll().forEach(booking -> {
            if (booking.getBookingType() != Booking.BookingType.HOTEL) {
                return;
            }
            if (booking.getTotalAmount() != null && booking.getTotalAmount() <= 30_000.0) {
                booking.setTotalAmount(toRupeesAtLeastMinimum(booking.getTotalAmount()));
            }
            booking.setTaxes(toRupeesIfLegacy(booking.getTaxes()));
            booking.setDiscount(toRupeesIfLegacy(booking.getDiscount()));
            booking.setRefundAmount(toRupeesIfLegacy(booking.getRefundAmount()));
        });
    }

    private static boolean isHotelPrice(PriceHistory history) {
        return history.getRoom() != null
                || history.getHotel() != null
                || history.getTargetType() == PriceFreeze.TargetType.HOTEL
                || history.getTargetType() == PriceFreeze.TargetType.ROOM;
    }

    private static double toRupeesAtLeastMinimum(double amount) {
        return Math.max(MINIMUM_NIGHTLY_RATE_INR, toRupeesIfLegacy(amount));
    }

    private static Double toRupeesIfLegacy(Double amount) {
        if (amount == null || amount >= 1_000.0) {
            return amount;
        }
        return Math.round(amount * 100.0) / 100.0;
    }
}
