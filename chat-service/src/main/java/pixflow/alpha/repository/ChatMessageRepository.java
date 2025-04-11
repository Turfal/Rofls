package pixflow.alpha.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.ChatMessage;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    Page<ChatMessage> findByConversationIdOrderByTimestampDesc(Long conversationId, Pageable pageable);

    List<ChatMessage> findByConversationIdOrderByTimestampAsc(Long conversationId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversationId = :conversationId AND m.senderId != :userId AND m.read = false")
    long countUnreadMessagesByConversation(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.conversationId = :conversationId AND m.senderId != :userId AND m.read = false")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}