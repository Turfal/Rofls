package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.Conversation;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p = :userId ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByParticipantId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE c.isDirectMessage = true AND SIZE(c.participants) = 2 AND :user1Id IN elements(c.participants) AND :user2Id IN elements(c.participants)")
    Optional<Conversation> findDirectMessageConversation(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}