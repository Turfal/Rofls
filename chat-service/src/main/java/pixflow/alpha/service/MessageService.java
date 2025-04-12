package pixflow.alpha.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pixflow.alpha.dto.CreateMessageDTO;
import pixflow.alpha.dto.MessageDTO;
import pixflow.alpha.model.Conversation;
import pixflow.alpha.model.Message;
import pixflow.alpha.repository.ConversationRepository;
import pixflow.alpha.repository.MessageRepository;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    @Transactional
    public MessageDTO createMessage(CreateMessageDTO createMessageDTO, String sender) {
        Conversation conversation = conversationRepository.findById(createMessageDTO.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Проверка участия пользователя в беседе с EAGER загрузкой
        boolean isParticipant = conversation.getParticipants().contains(sender);
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        Message message = new Message();
        message.setConversationId(createMessageDTO.getConversationId());
        message.setSender(sender);
        message.setContent(createMessageDTO.getContent());

        Message savedMessage = messageRepository.save(message);

        // Update conversation's last message time
        conversation.setLastMessageAt(savedMessage.getSentAt());
        conversationRepository.save(conversation);

        return convertToDTO(savedMessage);
    }

    // Разделим метод на два: один для получения сообщений, второй для маркировки их как прочитанных
    @Transactional(readOnly = true)
    public List<MessageDTO> getConversationMessages(Long conversationId, String username) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Проверка участия пользователя в беседе с EAGER загрузкой
        boolean isParticipant = conversation.getParticipants().contains(username);
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        return messageRepository.findByConversationIdOrderBySentAt(conversationId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Long conversationId, String username) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Проверка участия пользователя в беседе
        boolean isParticipant = conversation.getParticipants().contains(username);
        if (!isParticipant) {
            throw new RuntimeException("User is not a participant in this conversation");
        }

        // Mark messages as read
        messageRepository.markMessagesAsRead(conversationId, username);
    }

    public MessageDTO convertToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversationId());
        dto.setSender(message.getSender());
        dto.setContent(message.getContent());
        dto.setSentAt(message.getSentAt());
        dto.setRead(message.isRead());
        return dto;
    }
}