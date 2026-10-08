package com.mytrip.backend.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "flight_seats")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FlightSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id", nullable = false)
    private Flight flight;

    @Column(nullable = false)
    private String seatNumber;

    @Column(nullable = false)
    private Integer seatClass;

    @Column(nullable = false)
    private Boolean isAvailable;

    @Column(nullable = false)
    private Double price;

    @Column(name = "seat_row", nullable = false)
    private Integer rowNumber;

    @Column(nullable = false)
    private String seatColumn;

    @Column(nullable = false)
    private Boolean isAisle;

    @Column(nullable = false)
    private Boolean isWindow;

    public enum SeatClass {
        ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST_CLASS
    }

    // CONSTRUCTORS
    public FlightSeat() {}

    public FlightSeat(Long id, Flight flight, String seatNumber, Integer seatClass,
                      Boolean isAvailable, Double price, Integer rowNumber, String seatColumn,
                      Boolean isAisle, Boolean isWindow) {
        this.id = id;
        this.flight = flight;
        this.seatNumber = seatNumber;
        this.seatClass = seatClass;
        this.isAvailable = isAvailable;
        this.price = price;
        this.rowNumber = rowNumber;
        this.seatColumn = seatColumn;
        this.isAisle = isAisle;
        this.isWindow = isWindow;
    }

    // GETTERS AND SETTERS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Flight getFlight() { return flight; }
    public void setFlight(Flight flight) { this.flight = flight; }
    
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    
    public Integer getSeatClass() { return seatClass; }
    public void setSeatClass(Integer seatClass) { this.seatClass = seatClass; }
    
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    
    public Integer getRowNumber() { return rowNumber; }
    public void setRowNumber(Integer rowNumber) { this.rowNumber = rowNumber; }
    
    public String getSeatColumn() { return seatColumn; }
    public void setSeatColumn(String seatColumn) { this.seatColumn = seatColumn; }
    
    public Boolean getIsAisle() { return isAisle; }
    public void setIsAisle(Boolean isAisle) { this.isAisle = isAisle; }
    
    public Boolean getIsWindow() { return isWindow; }
    public void setIsWindow(Boolean isWindow) { this.isWindow = isWindow; }
}