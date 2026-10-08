package com.mytrip.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ReviewPhotoService {

    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.upload-dir:uploads/reviews}")
    private String uploadDirectory;

    public String store(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a photo to upload");
        }
        if (photo.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Review photos must be 5 MB or smaller");
        }
        String contentType = photo.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, or WebP photos are allowed");
        }
        String extension = switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image format");
        };
        Path directory = Path.of(uploadDirectory).toAbsolutePath().normalize();
        String filename = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(directory);
            Path destination = directory.resolve(filename).normalize();
            if (!destination.getParent().equals(directory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid photo path");
            }
            photo.transferTo(destination);
            return "/api/reviews/photos/" + filename;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save review photo", exception);
        }
    }

    public ResponseEntity<Resource> load(String filename) {
        if (!StringUtils.hasText(filename) || !filename.matches("[0-9a-fA-F-]{36}\\.(jpg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        Path path = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(filename).normalize();
        if (!path.startsWith(Path.of(uploadDirectory).toAbsolutePath().normalize()) || !Files.isRegularFile(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        MediaType contentType = switch (extension) {
            case "jpg" -> MediaType.IMAGE_JPEG;
            case "png" -> MediaType.IMAGE_PNG;
            default -> MediaType.parseMediaType("image/webp");
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .contentType(contentType)
                .body(new FileSystemResource(path));
    }
}
