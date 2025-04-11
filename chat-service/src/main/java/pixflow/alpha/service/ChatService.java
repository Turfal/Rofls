package pixflow.alpha.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import pixflow.alpha.dto.ChatDTOs.*;
import pixflow.alpha.model.ChatMessage;
import pixflow.alpha.model.Conversation;
import pixflow.alpha.repository.ChatMessageRepository;
import pixflow.alpha.repository.ConversationRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserService userService;

    public List<ConversationDTO> getConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findAllByParticipantId(userId);

        return conversations.stream().map(conversation -> {
            ConversationDTO dto = new ConversationDTO();
            dto.setId(conversation.getId());
            dto.setTitle(conversation.getTitle());
            dto.setDirectMessage(conversation.isDirectMessage());
            dto.setLastActivityAt(conversation.getUpdatedAt());

            // Load participants
            Set<UserDTO> participantDtos = conversation.getParticipants().stream()
                    .map(participantId -> {
                        UserDTO user = userService.getUserById(participantId);
                        return user != null ? user : new UserDTO(participantId, "Unknown User");
                    })
                    .collect(Collectors.toSet());
            dto.setParticipants(participantDtos);

            // Set conversation title for DMs based on the other user
            if (conversation.isDirectMessage() && participantDtos.size() == 2) {
                Optional<UserDTO> otherUser = participantDtos.stream()
                        .filter(p -> !p.getId().equals(userId))
                        .findFirst();

                otherUser.ifPresent(user -> dto.setTitle(user.getUsername()));
            }

            // Get last message
            List<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampDesc(
                    conversation.getId(), PageRequest.of(0, 1)).getContent();

            if (!messages.isEmpty()) {
                ChatMessage lastMessage = messages.get(0);
                MessageDTO lastMessageDto = convertToMessageDTO(lastMessage);
                dto.setLastMessage(lastMessageDto);
            }

            // Count unread messages
            long unreadCount = messageRepository.countUnreadMessagesByConversation(conversation.getId(), userId);
            dto.setUnreadCount((int) unreadCount);

            return dto;
        }).collect(Collectors.toList());
    }

    public ConversationDTO getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Check if user is a participant
        if (!conversation.getParticipants().contains(userId)) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setTitle(conversation.getTitle());
        dto.setDirectMessage(conversation.isDirectMessage());
        dto.setLastActivityAt(conversation.getUpdatedAt());

        // Load participants
        Set<UserDTO> participantDtos = conversation.getParticipants().stream()
                .map(participantId -> {
                    UserDTO user = userService.getUserById(participantId);
                    return user != null ? user : new UserDTO(participantId, "Unknown User");
                })
                .collect(Collectors.toSet());
        dto.setParticipants(participantDtos);

        // Set conversation title for DMs based on the other user
        if (conversation.isDirectMessage() && participantDtos.size() == 2) {
            Optional<UserDTO> otherUser = participantDtos.stream()
                    .filter(p -> !p.getId().equals(userId))
                    .findFirst();

            otherUser.ifPresent(user -> dto.setTitle(user.getUsername()));
        }

        // Count unread messages
        long unreadCount = messageRepository.countUnreadMessagesByConversation(conversationId, userId);
        dto.setUnreadCount((int) unreadCount);

        return dto;
    }

    public List<MessageDTO> getMessages(Long conversationId, Long userId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Check if user is a participant
        if (!conversation.getParticipants().contains(userId)) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, pageable)
                .getContent()
                .stream()
                .map(this::convertToMessageDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageDTO sendMessage(Long conversationId, Long senderId, CreateMessageRequest request) {
        // Verify conversation exists and user is a participant
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getParticipants().contains(senderId)) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        // Create and save message
        ChatMessage message = new ChatMessage();
        message.setConversationId(conversationId);
        message.setSenderId(senderId);
        message.setContent(request.getContent());
        message.setTimestamp(LocalDateTime.now());
        message.setRead(false);

        message = messageRepository.save(message);

        // Update conversation last activity time
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Convert to DTO
        MessageDTO messageDTO = convertToMessageDTO(message);

        // Send message to all participants via WebSocket
        for (Long participantId : conversation.getParticipants()) {
            if (!participantId.equals(senderId)) {
                ChatNotification notification = new ChatNotification(
                        conversation.getId(),
                        message.getId(),
                        senderId,
                        messageDTO.getSenderUsername(),
                        message.getContent(),
                        message.getTimestamp(),
                        "MESSAGE"
                );

                messagingTemplate.convertAndSendToUser(
                        participantId.toString(),
                        "/queue/messages",
                        notification
                );
            }
        }

        return messageDTO;
    }

    @Transactional
    public ConversationDTO createConversation(CreateConversationRequest request, Long creatorId) {
        // For direct messages, check if a conversation already exists between these users
        if (request.isDirectMessage() && request.getParticipantIds().size() == 1) {
            Long otherUserId = request.getParticipantIds().iterator().next();
            Optional<Conversation> existingConversation = conversationRepository
                    .findDirectMessageConversation(creatorId, otherUserId);

            if (existingConversation.isPresent()) {
                return getConversation(existingConversation.get().getId(), creatorId);
            }
        }

        // Create new conversation
        Conversation conversation = new Conversation();
        conversation.setTitle(request.getTitle());
        conversation.setDirectMessage(request.isDirectMessage());

        // Add all participants
        Set<Long> participants = new HashSet<>(request.getParticipantIds());
        participants.add(creatorId); // Make sure creator is included
        conversation.setParticipants(participants);

        conversation = conversationRepository.save(conversation);

        return getConversation(conversation.getId(), creatorId);
    }

    @Transactional
    public void markMessagesAsRead(Long conversationId, Long userId) {
        // Verify conversation exists and user is a participant
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conversation.getParticipants().contains(userId)) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        // Mark messages as read
        messageRepository.markMessagesAsRead(conversationId, userId);

        // Notify other participants that messages have been read
        ChatNotification notification = new ChatNotification(
                conversationId,
                null,
                userId,
                userService.getUserById(userId).getUsername(),
                null,
                LocalDateTime.now(),
                "READ"
        );

        for (Long participantId : conversation.getParticipants()) {
            if (!participantId.equals(userId)) {
                messagingTemplate.convertAndSendToUser(
                        participantId.toString(),
                        "/queue/notifications",
                        notification
                );
            }
        }
    }

    private MessageDTO convertToMessageDTO(ChatMessage message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversationId());
        dto.setSenderId(message.getSenderId());

        // Get sender username
        UserDTO sender = userService.getUserById(message.getSenderId());
        dto.setSenderUsername(sender != null ? sender.getUsername() : "Unknown User");

        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setRead(message.isRead());

        return dto;
    }
}