package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.util.JwtUtil;
import pixflow.alpha.dto.AuthRequest;
import pixflow.alpha.dto.AuthResponse;
import pixflow.alpha.dto.UserDTO;
import pixflow.alpha.model.User;
import pixflow.alpha.service.UserService;

import java.security.Principal;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(@RequestBody AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok(new AuthResponse(token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody UserDTO userDTO) {
        User user = userService.save(userDTO);

        // Создаем профиль через REST-запрос с query-параметром
        String profileServiceUrl = "http://localhost:8080/profiles/" + user.getId();
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("username", user.getUsername());
        HttpHeaders headers = new HttpHeaders();

        // Генерируем токен для пользователя
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        userDTO.getUsername(),
                        userDTO.getPassword()
                )
        );
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);
        headers.set("Authorization", "Bearer " + token);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            restTemplate.postForObject(profileServiceUrl,
                    request,
                    ProfileDTO.class);
        } catch (Exception e) {
            System.err.println("Failed to create profile: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = principal.getName();
        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        return ResponseEntity.ok(userDTO);
    }
}