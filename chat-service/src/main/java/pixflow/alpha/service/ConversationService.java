package pixflow.alpha.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pixflow.alpha.dto.ConversationDTO;
import pixflow.alpha.dto.CreateConversationDTO;
import pixflow.alpha.dto.MessageDTO;
import pixflow.alpha.model.Conversation;
import pixflow.alpha.model.Message;
import pixflow.alpha.repository.ConversationRepository;
import pixflow.alpha.repository.MessageRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;

    @Transactional
    public ConversationDTO createConversation(CreateConversationDTO createConversationDTO, String creator) {
        if (createConversationDTO.getParticipants() == null || createConversationDTO.getParticipants().isEmpty()) {
            throw new IllegalArgumentException("Conversation must have at least one participant");
        }

        Conversation conversation = new Conversation();
        conversation.setTitle(createConversationDTO.getTitle());

        // Add creator to participants if not already included
        createConversationDTO.getParticipants().add(creator);
        conversation.setParticipants(createConversationDTO.getParticipants());

        Conversation savedConversation = conversationRepository.save(conversation);
        return convertToDTO(savedConversation, creator);
    }

    @Transactional(readOnly = true)
    public List<ConversationDTO> getUserConversations(String username) {
        return conversationRepository.findByParticipant(username).stream()
                .map(conversation -> convertToDTO(conversation, username))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationDTO getConversation(Long conversationId, String username) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getParticipants().contains(username)) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        return convertToDTO(conversation, username);
    }

    @Transactional
    public void updateLastMessageTime(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    private ConversationDTO convertToDTO(Conversation conversation, String requestingUser) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setTitle(conversation.getTitle());
        dto.setParticipants(conversation.getParticipants());
        dto.setCreatedAt(conversation.getCreatedAt());
        dto.setLastMessageAt(conversation.getLastMessageAt());

        // Get unread count for the requesting user
        dto.setUnreadCount(messageRepository.countUnreadMessages(conversation.getId(), requestingUser));

        // Get the last message if available
        List<Message> messages = messageRepository.findByConversationIdOrderBySentAt(conversation.getId());
        if (!messages.isEmpty()) {
            Message lastMessage = messages.get(messages.size() - 1);
            dto.setLastMessage(messageService.convertToDTO(lastMessage));
        }

        return dto;
    }
}