package pixflow.alpha.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/chat")
@Tag(name = "Chat Pages", description = "Endpoints for serving chat-related HTML pages")
public class ChatPageController {

    @GetMapping
    @Operation(summary = "Chat home page", description = "Displays the main chat page")
    @ApiResponse(responseCode = "200", description = "Chat page displayed successfully")
    public String chatHomePage() {
        return "chat";
    }

    @GetMapping("/{conversationId}")
    @Operation(summary = "Conversation page", description = "Displays a specific conversation")
    @ApiResponse(responseCode = "200", description = "Conversation page displayed successfully")
    @ApiResponse(responseCode = "404", description = "Conversation not found")
    public String conversationPage(
            @Parameter(description = "ID of the conversation to display")
            @PathVariable("conversationId") Long conversationId,
            Model model) {
        model.addAttribute("conversationId", conversationId);
        return "chat";
    }

    @GetMapping("/new")
    @Operation(summary = "New chat page", description = "Displays the page for creating a new chat")
    @ApiResponse(responseCode = "200", description = "New chat page displayed successfully")
    public String newChatPage() {
        return "chat";
    }
}