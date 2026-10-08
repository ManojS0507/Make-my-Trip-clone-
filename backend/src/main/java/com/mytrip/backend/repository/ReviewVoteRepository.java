package com.mytrip.backend.repository;

import com.mytrip.backend.entity.ReviewVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewVoteRepository extends JpaRepository<ReviewVote, Long> {
    Optional<ReviewVote> findByReviewIdAndUserId(Long reviewId, Long userId);
}
