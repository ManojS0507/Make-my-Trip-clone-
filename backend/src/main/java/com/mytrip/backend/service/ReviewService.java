package com.mytrip.backend.service;

import com.mytrip.backend.entity.*;
import com.mytrip.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;

    @Transactional(readOnly = true)
    public List<Review> getReviews(String targetType, Long targetId, String sort, Integer rating) {
        List<Review> reviews = "HOTEL".equalsIgnoreCase(targetType)
                ? reviewRepository.findByHotelIdAndParentReviewIsNullAndModerationStatus(targetId, Review.ModerationStatus.VISIBLE)
                : reviewRepository.findByFlightIdAndParentReviewIsNullAndModerationStatus(targetId, Review.ModerationStatus.VISIBLE);
        SortOrder order;
        try {
            order = SortOrder.valueOf(sort.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sort must be NEWEST, HIGHEST_RATED, or MOST_HELPFUL");
        }
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating filter must be between 1 and 5");
        }
        List<Review> filtered = rating == null ? reviews : reviews.stream()
                .filter(review -> rating.equals(review.getRating())).toList();
        return switch (order) {
            case NEWEST -> filtered.stream().sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())).toList();
            case HIGHEST_RATED -> filtered.stream().sorted((a, b) -> {
                int ratingOrder = b.getRating().compareTo(a.getRating());
                return ratingOrder != 0 ? ratingOrder : b.getCreatedAt().compareTo(a.getCreatedAt());
            }).toList();
            case MOST_HELPFUL -> filtered.stream().sorted((a, b) -> {
                int votes = b.getHelpfulVotes().compareTo(a.getHelpfulVotes());
                return votes != 0 ? votes : b.getCreatedAt().compareTo(a.getCreatedAt());
            }).toList();
        };
    }

    @Transactional(readOnly = true)
    public List<Review> getReplies(Long id) {
        getReview(id);
        return reviewRepository.findByParentReviewIdAndModerationStatusOrderByCreatedAtAsc(id, Review.ModerationStatus.VISIBLE);
    }

    @Transactional
    public Review createReview(String email, String targetType, Long targetId, Integer rating,
                               String title, String comment, List<String> images) {
        validateContent(rating, title, comment);
        Review review = new Review();
        review.setUser(findUser(email));
        review.setRating(rating);
        review.setTitle(title.trim());
        review.setComment(comment.trim());
        review.setImages(images == null ? List.of() : List.copyOf(images));
        review.setHelpfulVotes(0);
        review.setTotalVotes(0);
        review.setIsFlagged(false);
        review.setModerationStatus(Review.ModerationStatus.VISIBLE);
        if ("HOTEL".equalsIgnoreCase(targetType)) {
            review.setHotel(hotelRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found")));
        } else if ("FLIGHT".equalsIgnoreCase(targetType)) {
            review.setFlight(flightRepository.findById(targetId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found")));
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target type must be HOTEL or FLIGHT");
        }
        return reviewRepository.save(review);
    }

    @Transactional
    public Review reply(String email, Long parentId, String comment) {
        if (comment == null || comment.isBlank() || comment.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply must contain 1-2000 characters");
        }
        Review parent = getReview(parentId);
        if (parent.getParentReview() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Replies to replies are not supported");
        }
        Review reply = new Review();
        reply.setUser(findUser(email));
        reply.setParentReview(parent);
        reply.setHotel(parent.getHotel());
        reply.setFlight(parent.getFlight());
        reply.setRating(parent.getRating());
        reply.setTitle("Reply");
        reply.setComment(comment.trim());
        reply.setImages(List.of());
        reply.setHelpfulVotes(0);
        reply.setTotalVotes(0);
        reply.setModerationStatus(Review.ModerationStatus.VISIBLE);
        return reviewRepository.save(reply);
    }

    @Transactional
    public Review voteHelpful(String email, Long reviewId) {
        Review review = getReview(reviewId);
        if (review.getParentReview() != null || review.getModerationStatus() != Review.ModerationStatus.VISIBLE) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        User user = findUser(email);
        if (reviewVoteRepository.findByReviewIdAndUserId(reviewId, user.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already rated this review");
        }
        ReviewVote vote = new ReviewVote();
        vote.setReview(review);
        vote.setUser(user);
        vote.setHelpful(true);
        reviewVoteRepository.save(vote);
        review.setHelpfulVotes(review.getHelpfulVotes() + 1);
        review.setTotalVotes(review.getTotalVotes() + 1);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review flagReview(Long id) {
        Review review = getReview(id);
        if (review.getParentReview() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only top-level reviews can be flagged");
        }
        review.setIsFlagged(true);
        review.setModerationStatus(Review.ModerationStatus.PENDING);
        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public List<Review> getFlaggedReviews() {
        return reviewRepository.findByIsFlaggedTrueAndModerationStatus(Review.ModerationStatus.PENDING);
    }

    @Transactional
    public Review moderate(Long id, String decision, String notes) {
        Review review = getReview(id);
        if (!Boolean.TRUE.equals(review.getIsFlagged())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only flagged reviews can be moderated");
        }
        if (notes == null || notes.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Moderation notes are required");
        }
        review.setModeratorNotes(notes.substring(0, Math.min(notes.length(), 500)));
        if ("REMOVE".equalsIgnoreCase(decision)) {
            review.setModerationStatus(Review.ModerationStatus.REMOVED);
        } else if ("APPROVE".equalsIgnoreCase(decision)) {
            review.setModerationStatus(Review.ModerationStatus.VISIBLE);
            review.setIsFlagged(false);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be APPROVE or REMOVE");
        }
        return reviewRepository.save(review);
    }

    @Transactional
    public Review updateOwnReview(String email, Long id, Integer rating, String title, String comment) {
        Review review = getReview(id);
        if (!review.getUser().getEmail().equals(email) || review.getParentReview() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        validateContent(rating, title, comment);
        review.setRating(rating);
        review.setTitle(title.trim());
        review.setComment(comment.trim());
        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteOwnReview(String email, Long id) {
        Review review = getReview(id);
        if (!review.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
        reviewRepository.delete(review);
    }

    private Review getReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private void validateContent(Integer rating, String title, String comment) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }
        if (title == null || title.isBlank() || title.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must contain 1-200 characters");
        }
        if (comment == null || comment.isBlank() || comment.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review must contain 1-2000 characters");
        }
        if (comment.matches("(?s).*<\\s*script.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review contains unsupported markup");
        }
    }

    private enum SortOrder {
        NEWEST, HIGHEST_RATED, MOST_HELPFUL
    }
}
