package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false)
    private String sender;

    @Column(length = 1000)
    private String content;

    @Column
    private String mediaUrl;     // URL to media file

    @Column
    private String mediaType;    // Type of media (image/video)

    @Column
    private Boolean isRepost = false;    // Flag to indicate if this is a repost

    @Column
    private Long originalPostId; // ID of the original post (for reposts)

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @Column
    private boolean read = false;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}