package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.config.ChatPrincipal;
import pixflow.alpha.dto.ChatDTOs.*;
import pixflow.alpha.service.ChatService;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        return ResponseEntity.ok(chatService.getConversations(user.getUserId()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationDTO> getConversation(@PathVariable Long conversationId, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        return ResponseEntity.ok(chatService.getConversation(conversationId, user.getUserId()));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDTO> createConversation(@RequestBody CreateConversationRequest request, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        return ResponseEntity.ok(chatService.createConversation(request, user.getUserId()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        return ResponseEntity.ok(chatService.getMessages(conversationId, user.getUserId(), page, size));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageDTO> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody CreateMessageRequest request,
            Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        return ResponseEntity.ok(chatService.sendMessage(conversationId, user.getUserId(), request));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long conversationId, Principal principal) {
        ChatPrincipal user = (ChatPrincipal) principal;
        chatService.markMessagesAsRead(conversationId, user.getUserId());
        return ResponseEntity.ok().build();
    }
}