package pixflow.alpha.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentDTO {
    private Long id;
    private Long postId;
    private String username;
    private String content;
    private LocalDateTime createdAt;
}