package pixflow.alpha.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PageController {

    @GetMapping("/login")
    public String login() {
        return "login"; // Возвращает файл login.html
    }

    @GetMapping("/register")
    public String register() {
        return "register"; // Возвращает файл register.html
    }

    @GetMapping("/home")
    public String home() {
        return "home"; // Возвращает файл home.html
    }
}