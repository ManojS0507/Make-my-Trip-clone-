package com.mytrip.backend.repository;

import com.mytrip.backend.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    List<UserPreference> findByUserId(Long userId);
    Optional<UserPreference> findByUserIdAndKey(Long userId, String key);
}
