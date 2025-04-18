package pixflow.alpha.dto;

import lombok.Data;

@Data
public class CreateMessageDTO {
    private Long conversationId;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private Boolean isRepost = false;
    private Long originalPostId;
}