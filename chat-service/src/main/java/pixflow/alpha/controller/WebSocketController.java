package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import pixflow.alpha.dto.ChatMessageDTO;
import pixflow.alpha.dto.CreateMessageDTO;
import pixflow.alpha.dto.MessageDTO;
import pixflow.alpha.service.MessageService;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    @Transactional // Добавлена транзакция
    public void sendMessage(@Payload CreateMessageDTO messageDTO, Principal principal) {
        if (principal == null) {
            log.error("Unauthorized attempt to send message");
            return;
        }

        String sender = principal.getName();
        log.debug("Received message from {}: {}", sender, messageDTO.getContent());

        try {
            // Process and store the message
            MessageDTO savedMessage = messageService.createMessage(messageDTO, sender);

            // Broadcast to subscribers
            messagingTemplate.convertAndSend(
                    "/topic/conversation." + messageDTO.getConversationId(),
                    new ChatMessageDTO(savedMessage, "MESSAGE")
            );
        } catch (Exception e) {
            log.error("Error processing WebSocket message", e);
        }
    }

    @MessageMapping("/chat.join")
    public void joinChat(@Payload Long conversationId, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        if (principal == null) {
            log.error("Unauthorized attempt to join chat");
            return;
        }

        String username = principal.getName();
        log.debug("User {} joined conversation {}", username, conversationId);

        // Notify other participants that user joined
        messagingTemplate.convertAndSend(
                "/topic/conversation." + conversationId,
                new ChatMessageDTO(null, "JOIN")
        );
    }
}