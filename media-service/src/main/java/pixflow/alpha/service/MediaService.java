package pixflow.alpha.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
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
public class MediaService {
    private final MinioClient minioClient;
    private final MediaPostRepository mediaPostRepository;

    @Value("${minio.bucket}")
    private String bucketName;

    public MediaPostDTO uploadImage(MultipartFile file) throws Exception {
        // Получаем username из атрибутов запроса
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        String originalFilename = file.getOriginalFilename();
        assert originalFilename != null;
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String uniqueFileName = UUID.randomUUID() + fileExtension;

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
        // Получаем username из атрибутов запроса
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

        mediaPostRepository.delete(mediaPost);
    }

    private MediaPostDTO convertToDTO(MediaPost mediaPost) {
        MediaPostDTO dto = new MediaPostDTO();
        dto.setId(mediaPost.getId());
        dto.setUsername(mediaPost.getUsername());
        dto.setImageUrl(mediaPost.getImageUrl());
        dto.setCreatedAt(mediaPost.getCreatedAt());
        return dto;
    }
}