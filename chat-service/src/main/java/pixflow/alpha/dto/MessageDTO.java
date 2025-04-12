package pixflow.alpha.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Long id;
    private Long conversationId;
    private String sender;
    private String content;
    private LocalDateTime sentAt;
    private boolean read;
}