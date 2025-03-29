package pixflow.alpha.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    // 404 - Page Not Found
    @GetMapping("/error/404")
    public String notFoundPage(Model model, @RequestParam(value = "message", required = false) String message, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.NOT_FOUND);
        model.addAttribute("errorMessage", message != null && !message.isEmpty()
                ? message
                : "Looks like this page got lost in the Roflogram universe. Maybe it’s off exploring a galaxy far, far away? 🚀");
        return "error-404";
    }

    // 403 - Forbidden
    @GetMapping("/error/403")
    public String forbiddenPage(Model model, @RequestParam(value = "message", required = false) String message, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        model.addAttribute("errorMessage", message != null && !message.isEmpty()
                ? message
                : "Sorry, but this area is off-limits. It’s like trying to sneak into a VIP party without an invite! 🎉");
        return "error-403";
    }

    // 500 - Internal Server Error
    @GetMapping("/error/500")
    public String internalServerErrorPage(Model model, @RequestParam(value = "message", required = false) String message, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
        model.addAttribute("errorMessage", message != null && !message.isEmpty()
                ? message
                : "Our servers just had a little meltdown. Don’t worry, our team is on it—probably with some coffee and a fire extinguisher! 🔥");
        return "error-500";
    }
}