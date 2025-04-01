package pixflow.alpha.controller;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pixflow.alpha.dto.MediaPostDTO;
import pixflow.alpha.service.MediaService;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {
    private final MediaService mediaService;
    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    private static final Map<String, MediaType> CONTENT_TYPES = Map.of(
            "jpg", MediaType.IMAGE_JPEG,
            "jpeg", MediaType.IMAGE_JPEG,
            "png", MediaType.IMAGE_PNG,
            "gif", MediaType.IMAGE_GIF,
            "mp4", MediaType.parseMediaType("video/mp4"),
            "webm", MediaType.parseMediaType("video/webm"),
            "mov", MediaType.parseMediaType("video/quicktime")
    );

    @PostMapping("/upload")
    public ResponseEntity<MediaPostDTO> uploadMedia(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(mediaService.uploadMedia(file));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<MediaPostDTO>> getAllMediaPosts() {
        return ResponseEntity.ok(mediaService.getAllMediaPosts());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteMediaPost(@PathVariable("id") Long id) {
        mediaService.deleteMediaPost(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable("filename") String filename) throws Exception {
        log.info("Request to serve file: {}", filename);
        try {
            // Determine content type based on file extension
            String fileExtension = getFileExtension(filename).toLowerCase();
            MediaType contentType = CONTENT_TYPES.getOrDefault(fileExtension, MediaType.APPLICATION_OCTET_STREAM);

            // Get file from MinIO
            InputStream fileStream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filename)
                            .build()
            );

            // Set appropriate headers
            HttpHeaders headers = new HttpHeaders();
            if (fileExtension.equals("mp4") || fileExtension.equals("webm") || fileExtension.equals("mov")) {
                headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");
            }

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(contentType)
                    .body(new InputStreamResource(fileStream));
        } catch (Exception e) {
            log.error("Error serving file {}: {}", filename, e.getMessage());
            throw e;
        }
    }

    private String getFileExtension(String filename) {
        int lastIndexOf = filename.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return ""; // Empty extension
        }
        return filename.substring(lastIndexOf + 1);
    }
}