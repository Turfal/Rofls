package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "app_profile")
public class Profile {

    @Id
    private Long userId;

    private String username;
    private String bio;
    private int rating;
    private int postsCount;
    private int commentsCount;
    private String avatarUrl;
    private LocalDateTime joinDate;
    private LocalDateTime lastActive;

    // Statistics
    private int totalUpvotes;
    private int totalDownvotes;
    private int achievementsCount;
}