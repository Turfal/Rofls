package pixflow.alpha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ServerWebExchange;

@Controller
public class PageController {

    @GetMapping("/login")
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

    @GetMapping("/registration")
    public String registerPage() {
        return "register";
    }

    @GetMapping("/")
    public String homePage() {
        return "home";
    }

    @GetMapping("/profile")
    public String myProfilePage() {
        return "profile";
    }

    @GetMapping("/profile/{userId}")
    public String userProfilePage(@PathVariable("userId") Long userId, Model model) {
        model.addAttribute("userId", userId);
        return "profile";
    }

    @GetMapping("/profile/username/{username}")
    public String userProfilePageByUsername(@PathVariable("username") String username, Model model) {
        model.addAttribute("username", username);
        return "profile";
    }

    @GetMapping("/chat")
    public String chatPage() {
        return "chat";
    }

    @GetMapping("/chat/{conversationId}")
    public String conversationPage(@PathVariable("conversationId") Long conversationId, Model model) {
        model.addAttribute("conversationId", conversationId);
        return "chat";
    }

    @GetMapping("/chat/new")
    public String newChatPage() {
        return "newchat";
    }
}