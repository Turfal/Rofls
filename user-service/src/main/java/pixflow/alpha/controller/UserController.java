package pixflow.alpha.controller;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.dto.UserDTO;
import pixflow.alpha.model.User;
import pixflow.alpha.service.UserService;

import java.security.Principal;
import java.util.Map;

@Data
@RestController
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/user/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id){
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToDTO(user));
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<ProfileDTO> getUserProfile(@PathVariable Long id){
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user.getProfile());
    }

    @PostMapping("/register")
    public ResponseEntity<UserDTO> registerUser(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        userService.save(userDTO);

        try {
            request.login(userDTO.getUsername(), userDTO.getPassword()); // ✅ автологин
        } catch (ServletException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(userDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request, Principal principal) {
        HttpSession session = request.getSession(false);
        System.out.println("Session: " + (session != null ? session.getId() : "null"));
        System.out.println("Principal: " + (principal != null ? principal.getName() : "null"));

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not Authenticated");
        }

        return ResponseEntity.ok(Map.of("username", principal.getName()));
    }



    @PutMapping("/update/{id}")
    public ResponseEntity<UserDTO> updateUserById(@PathVariable Long id, @RequestBody UserDTO userDTO){
        userService.updateById(id, userDTO);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(userDTO);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<UserDTO> deleteUserById(@PathVariable Long id){
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UserDTO convertToDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        userDTO.setBio(user.getBio());
        userDTO.setRating(user.getRating());
        userDTO.setPassword(user.getPassword());
        return userDTO;
    }
}
