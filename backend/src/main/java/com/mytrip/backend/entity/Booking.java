package com.mytrip.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "bookings")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 20)
    private String bookingReference;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BookingType bookingType;

    // For hotel bookings
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;

    // For flight bookings
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id")
    private Flight flight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_room_id")
    private HotelRoom hotelRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_seat_id")
    private FlightSeat flightSeat;

    // Hotel specific fields
    @Column(name = "check_in_date")
    @Temporal(TemporalType.DATE)
    private Date checkInDate;

    @Column(name = "check_out_date")
    @Temporal(TemporalType.DATE)
    private Date checkOutDate;

    // Common fields
    @Column(nullable = false)
    private Integer passengerCount;

    @Column(nullable = false)
    private Double totalAmount;

    private Double taxes;

    private Double discount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    @Column(name = "payment_status")
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Column(name = "payment_method", length = 30)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_reference", unique = true, length = 40)
    private String paymentReference;

    @Column(name = "paid_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date paidAt;

    @Column(name = "booking_date", updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date bookingDate;

    @Column(name = "cancellation_date")
    @Temporal(TemporalType.TIMESTAMP)
    private Date cancellationDate;

    private Double refundAmount;

    @Column(name = "refund_status")
    @Enumerated(EnumType.STRING)
    private RefundStatus refundStatus;

    @Column(name = "cancellation_reason", length = 200)
    private String cancellationReason;

    @Column(name = "refund_expected_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date refundExpectedAt;

    @Column(name = "refund_processed_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date refundProcessedAt;

    // CONSTRUCTORS
    public Booking() {}

    public Booking(Long id, User user, String bookingReference, BookingType bookingType,
                   Hotel hotel, Flight flight, Date checkInDate, Date checkOutDate,
                   Integer passengerCount, Double totalAmount, Double taxes, Double discount,
                   BookingStatus status, Date bookingDate, Date cancellationDate,
                   Double refundAmount, RefundStatus refundStatus, String cancellationReason) {
        this.id = id;
        this.user = user;
        this.bookingReference = bookingReference;
        this.bookingType = bookingType;
        this.hotel = hotel;
        this.flight = flight;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.passengerCount = passengerCount;
        this.totalAmount = totalAmount;
        this.taxes = taxes;
        this.discount = discount;
        this.status = status;
        this.bookingDate = bookingDate;
        this.cancellationDate = cancellationDate;
        this.refundAmount = refundAmount;
        this.refundStatus = refundStatus;
        this.cancellationReason = cancellationReason;
    }

    // GETTERS AND SETTERS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }
    
    public BookingType getBookingType() { return bookingType; }
    public void setBookingType(BookingType bookingType) { this.bookingType = bookingType; }
    
    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }
    
    public Flight getFlight() { return flight; }
    public void setFlight(Flight flight) { this.flight = flight; }

    public HotelRoom getHotelRoom() { return hotelRoom; }
    public void setHotelRoom(HotelRoom hotelRoom) { this.hotelRoom = hotelRoom; }

    public FlightSeat getFlightSeat() { return flightSeat; }
    public void setFlightSeat(FlightSeat flightSeat) { this.flightSeat = flightSeat; }
    
    public Date getCheckInDate() { return checkInDate; }
    public void setCheckInDate(Date checkInDate) { this.checkInDate = checkInDate; }
    
    public Date getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(Date checkOutDate) { this.checkOutDate = checkOutDate; }
    
    public Integer getPassengerCount() { return passengerCount; }
    public void setPassengerCount(Integer passengerCount) { this.passengerCount = passengerCount; }
    
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    
    public Double getTaxes() { return taxes; }
    public void setTaxes(Double taxes) { this.taxes = taxes; }
    
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
    
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public Date getPaidAt() { return paidAt; }
    public void setPaidAt(Date paidAt) { this.paidAt = paidAt; }
    
    public Date getBookingDate() { return bookingDate; }
    public void setBookingDate(Date bookingDate) { this.bookingDate = bookingDate; }
    
    public Date getCancellationDate() { return cancellationDate; }
    public void setCancellationDate(Date cancellationDate) { this.cancellationDate = cancellationDate; }
    
    public Double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(Double refundAmount) { this.refundAmount = refundAmount; }
    
    public RefundStatus getRefundStatus() { return refundStatus; }
    public void setRefundStatus(RefundStatus refundStatus) { this.refundStatus = refundStatus; }
    
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public Date getRefundExpectedAt() { return refundExpectedAt; }
    public void setRefundExpectedAt(Date refundExpectedAt) { this.refundExpectedAt = refundExpectedAt; }

    public Date getRefundProcessedAt() { return refundProcessedAt; }
    public void setRefundProcessedAt(Date refundProcessedAt) { this.refundProcessedAt = refundProcessedAt; }

    // JPA LIFECYCLE
    @PrePersist
    protected void onCreate() {
        bookingDate = new Date();
    }

    // ENUMS
    public enum BookingType {
        HOTEL, FLIGHT
    }

    public enum BookingStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED
    }

    public enum PaymentStatus {
        PENDING, PAID, FAILED
    }

    public enum PaymentMethod {
        DEMO_CARD, DEMO_UPI
    }

    public enum RefundStatus {
        NONE, PENDING, PROCESSED, COMPLETED, FAILED
    }
}