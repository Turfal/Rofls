package pixflow.alpha.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String bio;
    private int rating;
}
