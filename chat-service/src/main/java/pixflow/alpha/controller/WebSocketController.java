package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import pixflow.alpha.config.ChatPrincipal;
import pixflow.alpha.dto.ChatDTOs.*;
import pixflow.alpha.service.ChatService;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            @Payload CreateMessageRequest request,
            Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        MessageDTO message = chatService.sendMessage(conversationId, user.getUserId(), request);

        // Message is sent to participants by the ChatService
    }

    @MessageMapping("/chat/{conversationId}/read")
    public void markAsRead(@DestinationVariable Long conversationId, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        chatService.markMessagesAsRead(conversationId, user.getUserId());
    }

    @MessageMapping("/chat/{conversationId}/typing")
    public void typing(@DestinationVariable Long conversationId, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;

        // Notify other participants that user is typing
        ChatNotification notification = new ChatNotification(
                conversationId,
                null,
                user.getUserId(),
                user.getName(),
                null,
                LocalDateTime.now(),
                "TYPING"
        );

        // Send to all participants except the current user
        chatService.getConversation(conversationId, user.getUserId())
                .getParticipants()
                .stream()
                .filter(participant -> !participant.getId().equals(user.getUserId()))
                .forEach(participant ->
                        messagingTemplate.convertAndSendToUser(
                                participant.getId().toString(),
                                "/queue/notifications",
                                notification
                        )
                );
    }
}