package pixflow.alpha.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ChatMessageDTO;
import pixflow.alpha.dto.CreateMessageDTO;
import pixflow.alpha.dto.MessageDTO;
import pixflow.alpha.service.MessageService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/send")
    public ResponseEntity<MessageDTO> sendMessage(
            @RequestBody CreateMessageDTO createMessageDTO,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        MessageDTO message = messageService.createMessage(createMessageDTO, username);

        // Send the message to WebSocket subscribers
        messagingTemplate.convertAndSend(
                "/topic/conversation." + createMessageDTO.getConversationId(),
                new ChatMessageDTO(message, "MESSAGE")
        );

        return ResponseEntity.ok(message);
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<MessageDTO>> getConversationMessages(
            @PathVariable Long conversationId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        return ResponseEntity.ok(messageService.getConversationMessages(conversationId, username));
    }
}