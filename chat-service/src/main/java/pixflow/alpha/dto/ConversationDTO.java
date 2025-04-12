package pixflow.alpha.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
public class ConversationDTO {
    private Long id;
    private String title;
    private Set<String> participants;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private MessageDTO lastMessage;
}