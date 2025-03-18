package pixflow.alpha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ServerWebExchange;

@Controller
public class PageController {

    @GetMapping("/login-page")
    public String loginPage(ServerWebExchange exchange, Model model) {
        String logout = exchange.getRequest().getQueryParams().getFirst("logout");
        String error = exchange.getRequest().getQueryParams().getFirst("error");

        if (logout != null) {
            model.addAttribute("message", "Вы успешно вышли из аккаунта.");
        } else if (error != null) {
            model.addAttribute("error", "Неверный логин или пароль.");
        }

        return "login";
    }

    @GetMapping("/register-page")
    public String registerPage() {
        return "register";
    }

    @GetMapping("/home")
    public String homePage() {
        return "home";
    }
}