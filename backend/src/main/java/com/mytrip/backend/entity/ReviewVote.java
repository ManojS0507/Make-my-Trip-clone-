package com.mytrip.backend.entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "review_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"review_id", "user_id"}))
public class ReviewVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Boolean helpful;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(nullable = false)
    private Date createdAt = new Date();

    public Long getId() { return id; }
    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Boolean getHelpful() { return helpful; }
    public void setHelpful(Boolean helpful) { this.helpful = helpful; }
    public Date getCreatedAt() { return createdAt; }
}
