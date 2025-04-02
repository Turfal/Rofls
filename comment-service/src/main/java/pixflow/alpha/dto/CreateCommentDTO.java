package pixflow.alpha.dto;

import lombok.Data;

@Data
public class CreateCommentDTO {
    private Long postId;
    private String content;
}