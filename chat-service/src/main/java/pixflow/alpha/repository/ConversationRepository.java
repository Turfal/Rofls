package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.Conversation;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p = :username ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByParticipant(@Param("username") String username);
}