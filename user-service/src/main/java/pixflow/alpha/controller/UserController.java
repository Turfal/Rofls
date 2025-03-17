package pixflow.alpha.controller;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.dto.UserDTO;
import pixflow.alpha.model.User;
import pixflow.alpha.service.UserService;

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
    public ResponseEntity<UserDTO> registerUser(@RequestBody UserDTO userDTO) {
        System.out.println("Received registration request: " + userDTO);
        userService.save(userDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(userDTO);
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
