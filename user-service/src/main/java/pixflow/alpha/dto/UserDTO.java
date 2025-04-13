package pixflow.alpha.dto;

import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String bio;
    private int rating;
    private Set<String> roles = new HashSet<>();
    private boolean enabled = true;
}
