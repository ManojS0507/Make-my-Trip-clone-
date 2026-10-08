package com.mytrip.backend.repository;

import com.mytrip.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByHotelId(Long hotelId);
    List<Review> findByFlightId(Long flightId);
    List<Review> findByUserId(Long userId);
    List<Review> findByHotelIdAndParentReviewIsNullAndModerationStatus(Long hotelId, Review.ModerationStatus status);
    List<Review> findByFlightIdAndParentReviewIsNullAndModerationStatus(Long flightId, Review.ModerationStatus status);
    List<Review> findByParentReviewIdAndModerationStatusOrderByCreatedAtAsc(Long reviewId, Review.ModerationStatus status);
    List<Review> findByIsFlaggedTrueAndModerationStatus(Review.ModerationStatus status);
}