package com.mytrip.backend.repository;

import com.mytrip.backend.entity.RecommendationFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface RecommendationFeedbackRepository extends JpaRepository<RecommendationFeedback, Long> {
    Optional<RecommendationFeedback> findByUserIdAndTargetTypeAndTargetId(Long userId, String targetType, Long targetId);
    List<RecommendationFeedback> findByUserIdAndHelpfulFalse(Long userId);
}
