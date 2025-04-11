package pixflow.alpha.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public class ChatDTOs {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageDTO {
        private Long id;
        private Long conversationId;
        private Long senderId;
        private String senderUsername;
        private String content;
        private LocalDateTime timestamp;
        private boolean read;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationDTO {
        private Long id;
        private String title;
        private Set<UserDTO> participants = new HashSet<>();
        private boolean isDirectMessage;
        private LocalDateTime lastActivityAt;
        private MessageDTO lastMessage;
        private int unreadCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private Long id;
        private String username;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateMessageRequest {
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateConversationRequest {
        private String title;
        private Set<Long> participantIds = new HashSet<>();
        private boolean isDirectMessage = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatNotification {
        private Long conversationId;
        private Long messageId;
        private Long senderId;
        private String senderUsername;
        private String content;
        private LocalDateTime timestamp;
        private String type;  // "MESSAGE", "READ", "TYPING", etc.
    }
}