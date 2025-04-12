package pixflow.alpha.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Long id;
    private Long conversationId;
    private String sender;
    private String content;
    private String mediaUrl;     // URL to media file (image/video)
    private String mediaType;    // Type of media (image or video)
    private Boolean isRepost;    // Flag to indicate if this is a repost
    private Long originalPostId; // ID of the original post (for reposts)
    private LocalDateTime sentAt;
    private boolean read;
}