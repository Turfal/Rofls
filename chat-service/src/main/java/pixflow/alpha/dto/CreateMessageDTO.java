package pixflow.alpha.dto;

import lombok.Data;

@Data
public class CreateMessageDTO {
    private Long conversationId;
    private String content;
}