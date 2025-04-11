package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Table(name = "conversation")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // For direct message conversations, we need to track the participants
    @ElementCollection
    @CollectionTable(name = "conversation_participant",
            joinColumns = @JoinColumn(name = "conversation_id"))
    @Column(name = "user_id")
    private Set<Long> participants = new HashSet<>();

    // Whether this is a direct message (between two users) or a group chat
    private boolean isDirectMessage = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}