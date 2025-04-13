package pixflow.alpha.exception;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.nio.file.AccessDeniedException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @Operation(summary = "Handle resource not found", description = "Handles ResourceNotFoundException and returns a 404 page")
    @ApiResponse(responseCode = "404", description = "Resource not found page")
    public String handleResourceNotFound(ResourceNotFoundException ex, Model model) {
        model.addAttribute("message", ex.getMessage());
        return "404"; // Returns 404.html template
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    @Operation(summary = "Handle access denied", description = "Handles AccessDeniedException and returns a 403 page")
    @ApiResponse(responseCode = "403", description = "Access denied page")
    public String handleAccessDenied(AccessDeniedException ex, Model model) {
        model.addAttribute("message", "You do not have permission to access this resource.");
        return "403"; // Returns 403.html template
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @Operation(summary = "Handle general exceptions", description = "Handles all other exceptions and returns a 500 page")
    @ApiResponse(responseCode = "500", description = "Internal server error page")
    public String handleInternalServerError(Exception ex, Model model) {
        model.addAttribute("message", "An unexpected error occurred.");
        return "500"; // Returns 500.html template
    }
}