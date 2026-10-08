package com.mytrip.backend.controller;

import com.mytrip.backend.entity.Review;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.service.ReviewPhotoService;
import com.mytrip.backend.service.ReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewPhotoService reviewPhotoService;

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Review>> getReviewsByHotelId(
            @PathVariable Long hotelId, @RequestParam(defaultValue = "NEWEST") String sort,
            @RequestParam(required = false) Integer rating) {
        return ResponseEntity.ok(reviewService.getReviews("HOTEL", hotelId, sort, rating));
    }

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<List<Review>> getReviewsByFlightId(
            @PathVariable Long flightId, @RequestParam(defaultValue = "NEWEST") String sort,
            @RequestParam(required = false) Integer rating) {
        return ResponseEntity.ok(reviewService.getReviews("FLIGHT", flightId, sort, rating));
    }

    @GetMapping("/{id}/replies")
    public ResponseEntity<List<Review>> getReplies(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReplies(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Review> createReview(@Valid @RequestBody ReviewRequest request,
                                               @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reviewService.createReview(user.getEmail(), request.targetType(), request.targetId(),
                request.rating(), request.title(), request.comment(), request.images()));
    }

    @PostMapping("/{id}/replies")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Review> reply(@PathVariable Long id, @Valid @RequestBody ReplyRequest request,
                                        @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reviewService.reply(user.getEmail(), id, request.comment()));
    }

    @PostMapping("/{id}/helpful")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Review> voteHelpful(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(reviewService.voteHelpful(user.getEmail(), id));
    }

    @PostMapping("/{id}/flag")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Review> flagReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.flagReview(id));
    }

    @GetMapping("/moderation/flagged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Review>> getFlaggedReviews() {
        return ResponseEntity.ok(reviewService.getFlaggedReviews());
    }

    @PutMapping("/{id}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Review> moderate(@PathVariable Long id, @Valid @RequestBody ModerationRequest request) {
        return ResponseEntity.ok(reviewService.moderate(id, request.decision(), request.notes()));
    }

    @PostMapping("/photos")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> uploadPhoto(@RequestPart("photo") MultipartFile photo) {
        return ResponseEntity.ok(Map.of("url", reviewPhotoService.store(photo)));
    }

    @GetMapping("/photos/{filename}")
    public ResponseEntity<Resource> getPhoto(@PathVariable String filename) {
        return reviewPhotoService.load(filename);
    }

    public record ReviewRequest(@NotBlank String targetType, @NotNull Long targetId,
                                @NotNull @Min(1) @Max(5) Integer rating,
                                @NotBlank String title, @NotBlank String comment,
                                List<String> images) {
    }

    public record ReplyRequest(@NotBlank String comment) {
    }

    public record ModerationRequest(@NotBlank String decision, @NotBlank String notes) {
    }
}
