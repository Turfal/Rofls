package pixflow.alpha.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostDTO {
    private Long id;
    private String username;
    private String content;
    private String imageUrl;
    private LocalDateTime createdAt;
}