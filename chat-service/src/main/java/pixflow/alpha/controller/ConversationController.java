package pixflow.alpha.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ConversationDTO;
import pixflow.alpha.dto.CreateConversationDTO;
import pixflow.alpha.service.ConversationService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
public class ConversationController {
    private final ConversationService conversationService;

    @PostMapping("/create")
    public ResponseEntity<ConversationDTO> createConversation(
            @RequestBody CreateConversationDTO createConversationDTO,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        return ResponseEntity.ok(conversationService.createConversation(createConversationDTO, username));
    }

    @GetMapping("/list")
    public ResponseEntity<List<ConversationDTO>> getUserConversations(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        return ResponseEntity.ok(conversationService.getUserConversations(username));
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationDTO> getConversation(
            @PathVariable Long conversationId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        return ResponseEntity.ok(conversationService.getConversation(conversationId, username));
    }
}