package pixflow.alpha.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
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

            try {
                Authentication auth = authenticationManager.authenticate(authReq);
                SecurityContextHolder.getContext().setAuthentication(auth);
                request.getSession(); // создаём сессию
                HttpSession session = request.getSession();
                System.out.println("Session ID: " + session.getId());
                System.out.println("Is New: " + session.isNew());
                return ResponseEntity.ok("Успешный вход");
            } catch (AuthenticationException e) {
                System.out.println("Ошибка аутентификации: " + e.getMessage()); // 🔥 Логируем
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Неверные данные");
            } catch (Exception e) {
                System.out.println("Другая ошибка: " + e.getMessage()); // 🔥 Логируем
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка сервера");
            }
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

