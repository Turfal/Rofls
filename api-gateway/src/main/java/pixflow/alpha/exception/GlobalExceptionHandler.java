package pixflow.alpha.exception;

import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.nio.file.AccessDeniedException;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Обработка ResourceNotFoundException (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleResourceNotFound(ResourceNotFoundException ex, Model model) {
        model.addAttribute("message", ex.getMessage());
        return "404"; // Возвращает шаблон 404.html
    }

    // Обработка ошибки 403 (Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleAccessDenied(AccessDeniedException ex, Model model) {
        model.addAttribute("message", "You do not have permission to access this resource.");
        return "403"; // Возвращает шаблон 403.html
    }

    // Обработка всех остальных исключений (500)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String handleInternalServerError(Exception ex, Model model) {
        model.addAttribute("message", "An unexpected error occurred.");
        return "500"; // Возвращает шаблон 500.html
    }
}