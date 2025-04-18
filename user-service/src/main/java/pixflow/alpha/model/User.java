package pixflow.alpha.model;

import jakarta.persistence.*;
import lombok.Data;
import pixflow.alpha.dto.ProfileDTO;

@Entity
@Data
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String username;
    private String role;
    private String email;
    private String password;
    private String bio;
    private int rating = 0;

}
