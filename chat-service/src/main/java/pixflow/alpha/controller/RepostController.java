package pixflow.alpha.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import pixflow.alpha.dto.ChatMessageDTO;
import pixflow.alpha.dto.CreateMessageDTO;
import pixflow.alpha.dto.MessageDTO;
import pixflow.alpha.dto.PostDTO;
import pixflow.alpha.dto.RepostDTO;
import pixflow.alpha.service.MessageService;

@Slf4j
@RestController
@RequestMapping("/repost")
@RequiredArgsConstructor
public class RepostController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/toConversation")
    public ResponseEntity<MessageDTO> repostToConversation(
            @RequestBody RepostDTO repostDTO,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        try {
            // First, get the original post details from post-service
            ResponseEntity<PostDTO> postResponse = restTemplate.getForEntity(
                    "http://post-service:8080/posts/" + repostDTO.getPostId(),
                    PostDTO.class);

            PostDTO post = postResponse.getBody();
            if (post == null) {
                return ResponseEntity.notFound().build();
            }

            // Create a message DTO for the repost
            CreateMessageDTO createMessageDTO = new CreateMessageDTO();
            createMessageDTO.setConversationId(repostDTO.getConversationId());
            createMessageDTO.setContent("Reposted: " + post.getContent());
            createMessageDTO.setMediaUrl(post.getMediaUrl());
            createMessageDTO.setMediaType(post.getMediaType());
            createMessageDTO.setIsRepost(true);
            createMessageDTO.setOriginalPostId(post.getId());

            // Create the message
            MessageDTO message = messageService.createMessage(createMessageDTO, username);

            // Notify WebSocket subscribers
            messagingTemplate.convertAndSend(
                    "/topic/conversation." + repostDTO.getConversationId(),
                    new ChatMessageDTO(message, "MESSAGE")
            );

            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error reposting to conversation: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
