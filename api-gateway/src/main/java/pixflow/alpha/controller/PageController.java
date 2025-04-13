package pixflow.alpha.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ServerWebExchange;

@Controller
@Tag(name = "Pages", description = "Endpoints for serving HTML pages")
public class PageController {

    @GetMapping("/login")
    @Operation(summary = "Login page", description = "Displays the login page")
    @ApiResponse(responseCode = "200", description = "Login page displayed successfully")
    public String loginPage(ServerWebExchange exchange, Model model) {
        String logout = exchange.getRequest().getQueryParams().getFirst("logout");
        String error = exchange.getRequest().getQueryParams().getFirst("error");

        if (logout != null) {
            model.addAttribute("message", "You have successfully logged out.");
        } else if (error != null) {
            model.addAttribute("error", "Invalid username or password.");
        }

        return "login";
    }

    @GetMapping("/registration")
    @Operation(summary = "Registration page", description = "Displays the user registration page")
    @ApiResponse(responseCode = "200", description = "Registration page displayed successfully")
    public String registerPage() {
        return "register";
    }

    @GetMapping("/")
    @Operation(summary = "Home page", description = "Displays the main feed/home page")
    @ApiResponse(responseCode = "200", description = "Home page displayed successfully")
    public String homePage() {
        return "home";
    }

    @GetMapping("/profile")
    @Operation(summary = "Current user's profile page", description = "Displays the profile page of the currently logged in user")
    @ApiResponse(responseCode = "200", description = "Profile page displayed successfully")
    public String myProfilePage() {
        return "profile";
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "User profile page by ID", description = "Displays the profile page of a user identified by their ID")
    @ApiResponse(responseCode = "200", description = "Profile page displayed successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    public String userProfilePage(
            @Parameter(description = "ID of the user") @PathVariable("userId") Long userId,
            Model model) {
        model.addAttribute("userId", userId);
        return "profile";
    }

    @GetMapping("/profile/username/{username}")
    @Operation(summary = "User profile page by username", description = "Displays the profile page of a user identified by their username")
    @ApiResponse(responseCode = "200", description = "Profile page displayed successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    public String userProfilePageByUsername(
            @Parameter(description = "Username of the user") @PathVariable("username") String username,
            Model model) {
        model.addAttribute("username", username);
        return "profile";
    }
}