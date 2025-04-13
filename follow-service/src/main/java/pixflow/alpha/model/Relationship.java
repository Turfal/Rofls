package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "relationships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"follower_username", "following_username"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Relationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_username", nullable = false)
    private String followerUsername;

    @Column(name = "following_username", nullable = false)
    private String followingUsername;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private boolean isFriend = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}