package pixflow.alpha.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PostDTO {
    private Long id;
    private String username;
    private String content;
    private String mediaUrl;
    private String mediaType; // Добавлено поле для типа медиа
    private LocalDateTime createdAt;
}