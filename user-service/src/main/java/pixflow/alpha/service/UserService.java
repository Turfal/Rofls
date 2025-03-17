package pixflow.alpha.service;

import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pixflow.alpha.dto.UserDTO;
import pixflow.alpha.model.User;
import pixflow.alpha.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

@Service
@Data
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final Map<Long, String> tokens = new HashMap<>();


    public User findById(Long id){
        return userRepository.findById(id).orElse(null);
    }
    public User findByUsername(String username){return userRepository.findByUsername(username).orElse(null);}
    public void storeToken(Long userId, String token) {
        tokens.put(userId, token);
    }

    public void removeToken(Long userId) {
        tokens.remove(userId);
    }

    public boolean isTokenValid(Long userId, String token) {
        return token.equals(tokens.get(userId));
    }
    public void save(UserDTO userDTO){
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setBio(userDTO.getBio());
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword())); //аба-аба...
        user.setRating(userDTO.getRating());
        user.setRole("USER_ROLE");
        userRepository.save(user);
    }

    public void updateById(Long id, UserDTO userDTO){
        User user = userRepository.findById(id).orElse(null);
        if(userDTO.getUsername()!=null && !userDTO.getUsername().isBlank()){
            assert user != null;
            user.setUsername(userDTO.getUsername());
        }
        if(userDTO.getEmail()!=null && !userDTO.getEmail().isBlank()){
            assert user != null;
            user.setEmail(userDTO.getEmail());
        }
        if(userDTO.getBio()!=null && !userDTO.getBio().isBlank()){
            assert user != null;
            user.setBio(userDTO.getBio());
        }
        assert user != null;

        userRepository.save(user);
    }

    public void deleteById(Long id){
        userRepository.deleteById(id);
    }
}
