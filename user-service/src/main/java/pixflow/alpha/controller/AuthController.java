package pixflow.alpha.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> user, HttpServletRequest request) {
        try {
            UsernamePasswordAuthenticationToken authReq =
                    new UsernamePasswordAuthenticationToken(user.get("username"), user.get("password"));

            Authentication auth = authenticationManager.authenticate(authReq);

            // Устанавливаем авторизацию в SecurityContext
            SecurityContextHolder.getContext().setAuthentication(auth);
            request.getSession(); // создаём сессию

            return ResponseEntity.ok("Успешный вход");
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Неверные данные");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        request.getSession().invalidate();
        return ResponseEntity.ok("Выход выполнен");
    }
}

