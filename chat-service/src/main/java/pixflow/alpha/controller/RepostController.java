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
    private final RestTemplate restTemplate;

    @PostMapping("/toConversation")
    public ResponseEntity<MessageDTO> repostToConversation(
            @RequestBody RepostDTO repostDTO,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        try {
            log.info("Attempting to repost post ID {} to conversation ID {}",
                    repostDTO.getPostId(), repostDTO.getConversationId());

            // Use direct URL format for now, until service discovery is properly configured
            String postUrl = "http://localhost:8083/posts/" + repostDTO.getPostId();
            log.info("Fetching post data from URL: {}", postUrl);

            // First, get the original post details from post-service using direct URL
            ResponseEntity<PostDTO> postResponse = new RestTemplate().getForEntity(
                    postUrl, PostDTO.class);

            PostDTO post = postResponse.getBody();
            if (post == null) {
                log.error("Post with ID {} not found", repostDTO.getPostId());
                return ResponseEntity.notFound().build();
            }

            log.info("Successfully retrieved post: {}", post);

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
            log.info("Created repost message: {}", message);

            // Notify WebSocket subscribers
            messagingTemplate.convertAndSend(
                    "/topic/conversation." + repostDTO.getConversationId(),
                    new ChatMessageDTO(message, "MESSAGE")
            );

            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error reposting to conversation: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}