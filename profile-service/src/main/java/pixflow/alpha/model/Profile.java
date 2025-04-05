package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.Data;
import pixflow.alpha.dto.ProfileDTO;

@Entity
@Data
@Table(name = "app_profiles")
public class Profile {
    @Id
    private Long userId;
    private String username;
    private String bio;
    private int rating;
    private int postsCount = 0;
    private int followersCount = 0;
    private int followingCount = 0;
    private String avatarUrl; // Assuming you might want to add avatar functionality

    public ProfileDTO toDTO() {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(userId);
        dto.setUsername(username);
        dto.setBio(bio);
        dto.setRating(rating);
        dto.setPostsCount(postsCount);
        dto.setFollowersCount(followersCount);
        dto.setFollowingCount(followingCount);
        return dto;
    }
}