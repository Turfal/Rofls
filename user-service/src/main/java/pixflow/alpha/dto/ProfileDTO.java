package pixflow.alpha.dto;

import lombok.Data;

@Data
public class ProfileDTO {
    private Long id;
    private String username;
    private String bio;
    private int rating;
}
