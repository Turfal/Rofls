package pixflow.alpha.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MediaPostDTO {
    private Long id;
    private String username;
    private String imageUrl;
    private LocalDateTime createdAt;
}