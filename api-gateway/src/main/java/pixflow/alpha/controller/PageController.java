package pixflow.alpha.controller;

import org.springframework.cloud.gateway.mvc.ProxyExchange;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class PageController {

    @GetMapping("/login")
    public String login() {
        return "login"; // Возвращает файл login.html
    }

    @PostMapping("/login")
    public ResponseEntity<?> processLogin(ProxyExchange<?> proxy) {
        // Перенаправляем POST-запрос на user-service
        return proxy.uri("lb://user-service/auth/login").post();
    }

    @GetMapping("/register")
    public String register() {
        return "register"; // Возвращает файл register.html
    }

    @PostMapping("/register")
    public ResponseEntity<?> processRegister(ProxyExchange<?> proxy) {
        // Перенаправляем POST-запрос на user-service
        return proxy.uri("lb://user-service/auth/register").post();
    }

    @GetMapping("/home")
    public String home() {
        return "home"; // Возвращает файл home.html
    }
}