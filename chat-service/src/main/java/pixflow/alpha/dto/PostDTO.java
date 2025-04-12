package pixflow.alpha.dto;

import lombok.Data;

@Data
public class PostDTO {
    private Long id;
    private String username;
    private String content;
    private String mediaUrl;
    private String mediaType;
}
