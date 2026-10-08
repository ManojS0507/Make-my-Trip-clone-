package com.mytrip.backend.repository;

import com.mytrip.backend.entity.PriceFreeze;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PriceFreezeRepository extends JpaRepository<PriceFreeze, Long> {
    List<PriceFreeze> findByUserIdAndExpiresAtAfterOrderByExpiresAtAsc(Long userId, java.util.Date now);
    Optional<PriceFreeze> findFirstByUserIdAndTargetTypeAndTargetIdAndExpiresAtAfterOrderByExpiresAtDesc(
            Long userId, PriceFreeze.TargetType targetType, Long targetId, java.util.Date now);
}
