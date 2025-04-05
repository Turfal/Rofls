package pixflow.alpha.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private Long id;
    private String username;
    private String bio;
    private int rating;
    private int postsCount;
    private int followersCount;
    private int followingCount;
}