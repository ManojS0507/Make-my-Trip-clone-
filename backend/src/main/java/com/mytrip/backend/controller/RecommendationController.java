package com.mytrip.backend.controller;

import com.mytrip.backend.entity.RecommendationFeedback;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.service.RecommendationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<RecommendationService.Recommendation>> getRecommendations(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(recommendationService.getRecommendations(user.getEmail()));
    }

    @GetMapping("/preferences")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> getPreferences(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(recommendationService.getPreferences(user.getEmail()));
    }

    @PutMapping("/preferences")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> savePreference(@AuthenticationPrincipal User user,
                                                @Valid @RequestBody PreferenceRequest request) {
        recommendationService.savePreference(user.getEmail(), request.key(), request.value());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/feedback")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<RecommendationFeedback> feedback(@AuthenticationPrincipal User user,
                                                           @Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(recommendationService.feedback(user.getEmail(), request.targetType(),
                request.targetId(), request.helpful()));
    }

    public record PreferenceRequest(@NotBlank String key, @NotBlank String value) {
    }

    public record FeedbackRequest(@NotBlank String targetType, @NotNull Long targetId, boolean helpful) {
    }
}
