package pixflow.alpha.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import pixflow.alpha.dto.MediaPostDTO;
import pixflow.alpha.model.MediaPost;
import pixflow.alpha.repository.MediaPostRepository;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {
    private final MinioClient minioClient;
    private final MediaPostRepository mediaPostRepository;

    @Value("${minio.bucket}")
    private String bucketName;

    public MediaPostDTO uploadMedia(MultipartFile file) throws Exception {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        String originalFilename = file.getOriginalFilename();
        assert originalFilename != null;
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID() + fileExtension;

        // Determine media type (image or video)
        String mediaType = determineMediaType(file.getContentType());
        log.info("Uploading {} file: {}, content type: {}", mediaType, uniqueFileName, file.getContentType());

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(uniqueFileName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );
        }

        String imageUrl = "/" + bucketName + "/" + uniqueFileName;

        MediaPost mediaPost = new MediaPost();
        mediaPost.setUsername(username);
        mediaPost.setImageUrl(imageUrl);
        mediaPost.setMediaType(mediaType); // Save media type

        MediaPost savedPost = mediaPostRepository.save(mediaPost);

        return convertToDTO(savedPost);
    }

    public List<MediaPostDTO> getAllMediaPosts() {
        return mediaPostRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteMediaPost(Long id) {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        MediaPost mediaPost = mediaPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Media post not found"));

        if (!mediaPost.getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        // Extract filename from URL
        String imageUrl = mediaPost.getImageUrl();
        String objectName = extractObjectNameFromUrl(imageUrl);

        // Delete file from MinIO
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from MinIO", e);
        }

        // Delete record from database
        mediaPostRepository.delete(mediaPost);
    }

    private MediaPostDTO convertToDTO(MediaPost mediaPost) {
        MediaPostDTO dto = new MediaPostDTO();
        dto.setId(mediaPost.getId());
        dto.setUsername(mediaPost.getUsername());
        dto.setImageUrl(mediaPost.getImageUrl());
        dto.setMediaType(mediaPost.getMediaType()); // Include media type
        dto.setCreatedAt(mediaPost.getCreatedAt());
        return dto;
    }

    /**
     * Extracts object name from URL.
     * Example: "/bucket-name/unique-file-name.jpg" -> "unique-file-name.jpg"
     */
    private String extractObjectNameFromUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            throw new IllegalArgumentException("Image URL cannot be null or empty");
        }

        // Split URL by slashes and take the last element
        String[] parts = imageUrl.split("/");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid image URL format");
        }

        return parts[parts.length - 1];
    }

    /**
     * Determines if the content is an image or video based on its content type
     */
    private String determineMediaType(String contentType) {
        if (contentType == null) {
            return "unknown";
        }

        if (contentType.startsWith("image/")) {
            return "image";
        } else if (contentType.startsWith("video/")) {
            return "video";
        } else {
            return "other";
        }
    }
}