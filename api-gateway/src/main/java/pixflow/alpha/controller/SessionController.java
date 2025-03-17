package pixflow.alpha.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestTemplate;
import pixflow.alpha.service.SessionStorage;

import java.util.Map;

@Controller
public class SessionController {

    @Autowired
    private SessionStorage sessionStorage;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/process-login")
    public String processLogin(@RequestBody Map<String, String> loginData, HttpServletResponse response) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(loginData, headers);

            // Отправка запроса на user-service
            String result = restTemplate.postForObject("http://user-service/auth/login", request, String.class);

            // Если авторизация успешна, создаем сессию
            if (result != null && result.contains("successful")) {
                String sessionId = sessionStorage.createSession(loginData.get("username"));

                // Создаем cookie с sessionId
                Cookie sessionCookie = new Cookie("SESSION_ID", sessionId);
                sessionCookie.setPath("/");
                sessionCookie.setMaxAge(3600); // 1 час
                response.addCookie(sessionCookie);

                return "redirect:/home";
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return "redirect:/login?error=true";
    }
}
