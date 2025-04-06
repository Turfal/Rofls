package pixflow.alpha.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProfileDTO {
    private Long userId;
    private String username;
    private String bio;
    private int rating;
    private int postsCount;
    private int commentsCount;
    private String avatarUrl;
    private LocalDateTime joinDate;
    private LocalDateTime lastActive;
    private int totalUpvotes;
    private int totalDownvotes;
    private int achievementsCount;
}