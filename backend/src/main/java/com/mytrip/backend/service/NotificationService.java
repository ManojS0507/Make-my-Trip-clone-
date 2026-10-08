package com.mytrip.backend.service;

import com.mytrip.backend.entity.Notification;
import com.mytrip.backend.entity.User;
import com.mytrip.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }

    public Notification getNotificationById(Long id, Long userId) {
        return notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    }

    public List<Notification> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false);
    }

    public Notification markAsRead(Long id, Long userId) {
        Notification notification = getNotificationById(id, userId);
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public void deleteNotification(Long id, Long userId) {
        Notification notification = getNotificationById(id, userId);
        notificationRepository.delete(notification);
    }

    public List<Notification> getNotificationsForUser(User user) {
        return getNotificationsByUserId(user.getId());
    }
}