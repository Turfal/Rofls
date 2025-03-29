package pixflow.alpha.controller;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pixflow.alpha.dto.MediaPostDTO;
import pixflow.alpha.service.MediaService;

import java.io.InputStream;
import java.util.List;
@Slf4j
@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {
    private final MediaService mediaService;
    private final MinioClient minioClient;
    @Value("${minio.bucket}")
    private String bucketName;
    @PostMapping("/upload")
    public ResponseEntity<MediaPostDTO> uploadImage(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(mediaService.uploadImage(file));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<MediaPostDTO>> getAllMediaPosts() {
        return ResponseEntity.ok(mediaService.getAllMediaPosts());
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deleteMediaPost(@PathVariable Long id) {
        mediaService.deleteMediaPost(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) throws Exception {
        log.info("Request to serve file: {}", filename);
        try {
            InputStream fileStream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(filename)
                            .build()
            );
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(new InputStreamResource(fileStream));
        } catch (Exception e) {
            log.error("Error serving file {}: {}", filename, e.getMessage());
            throw e;
        }
    }
}