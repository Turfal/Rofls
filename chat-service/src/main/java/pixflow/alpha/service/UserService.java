package pixflow.alpha.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import pixflow.alpha.dto.ChatDTOs.UserDTO;

@Service
public class UserService {

    private final RestTemplate restTemplate;

    @Value("${user.service.url:https://user-service}")
    private String userServiceUrl;

    public UserService() {
        this.restTemplate = new RestTemplate();
    }

    public UserDTO getUserById(Long userId) {
        try {
            return restTemplate.getForObject(userServiceUrl + "/users/" + userId, UserDTO.class);
        } catch (Exception e) {
            // In case of error (service down, network issues, etc.), return minimal info
            return new UserDTO(userId, "User " + userId);
        }
    }
}