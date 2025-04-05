package pixflow.alpha.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import pixflow.alpha.dto.UserDTO;

@FeignClient(name = "user-service")
public interface UserServiceClient {
    @GetMapping("/user/{id}")
    UserDTO getUser(@PathVariable Long id);
}