package pixflow.alpha.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String errorMessage = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            String redirectUrl;

            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                redirectUrl = "/error/404";
                if (errorMessage != null && !errorMessage.isEmpty()) {
                    redirectUrl += "?message=" + java.net.URLEncoder.encode(errorMessage, java.nio.charset.StandardCharsets.UTF_8);
                }
                return "redirect:" + redirectUrl;
            } else if (statusCode == HttpStatus.FORBIDDEN.value()) {
                redirectUrl = "/error/403";
                if (errorMessage != null && !errorMessage.isEmpty()) {
                    redirectUrl += "?message=" + java.net.URLEncoder.encode(errorMessage, java.nio.charset.StandardCharsets.UTF_8);
                }
                return "redirect:" + redirectUrl;
            } else if (statusCode == HttpStatus.INTERNAL_SERVER_ERROR.value()) {
                redirectUrl = "/error/500";
                if (errorMessage != null && !errorMessage.isEmpty()) {
                    redirectUrl += "?message=" + java.net.URLEncoder.encode(errorMessage, java.nio.charset.StandardCharsets.UTF_8);
                }
                return "redirect:" + redirectUrl;
            }
        }

        // Fallback for other errors
        String redirectUrl = "/error/500";
        String defaultMessage = "Something went wrong. Let's get you back on track!";
        redirectUrl += "?message=" + java.net.URLEncoder.encode(defaultMessage, java.nio.charset.StandardCharsets.UTF_8);
        return "redirect:" + redirectUrl;
    }
}