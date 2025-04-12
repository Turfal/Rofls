package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pixflow.alpha.model.Message;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderBySentAt(Long conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :conversationId AND m.read = false AND m.sender != :username")
    long countUnreadMessages(@Param("conversationId") Long conversationId, @Param("username") String username);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.read = true WHERE m.conversationId = :conversationId AND m.sender != :username")
    void markMessagesAsRead(@Param("conversationId") Long conversationId, @Param("username") String username);
}