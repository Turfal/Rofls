package pixflow.alpha.controller;

import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
@AllArgsConstructor
public class TestController {
    @GetMapping("/welcome")
    public String welcome(){
        return "This is unprotected page";
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('USER_ROLE')")
    public String pageForUser(){
        return "This page only for User";
    }

    @GetMapping("/admins")
    @PreAuthorize("hasAuthority('ADMIN_ROLE')")
    public String pageForAdmin(){
        return "This page only for Admin";
    }

    @GetMapping("/all")
    public String pageForAll(){
        return "This page for all";
    }
}
