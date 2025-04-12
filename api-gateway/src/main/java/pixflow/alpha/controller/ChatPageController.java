package pixflow.alpha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/chat")
public class ChatPageController {

    @GetMapping
    public String chatHomePage() {
        return "chat";
    }

    @GetMapping("/{conversationId}")
    public String conversationPage(@PathVariable("conversationId") Long conversationId, Model model) {
        model.addAttribute("conversationId", conversationId);
        return "chat";
    }

    @GetMapping("/new")
    public String newChatPage() {
        return "newchat";
    }
}