package pixflow.alpha.filter;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pixflow.alpha.service.SessionStorage;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
public class AuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private SessionStorage sessionStorage;

    private static final List<String> EXCLUDED_PATHS = Arrays.asList("/login", "/register", "/process-login");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Если путь не требует авторизации, пропускаем
        if (EXCLUDED_PATHS.stream().anyMatch(path::equals)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Проверяем наличие сессии
        Cookie[] cookies = request.getCookies();
        String sessionId = null;

        if (cookies != null) {
            Optional<Cookie> sessionCookie = Arrays.stream(cookies)
                    .filter(cookie -> "SESSION_ID".equals(cookie.getName()))
                    .findFirst();

            if (sessionCookie.isPresent()) {
                sessionId = sessionCookie.get().getValue();
            }
        }

        // Проверяем валидность сессии
        if (sessionId != null && sessionStorage.validateSession(sessionId)) {
            filterChain.doFilter(request, response);
        } else {
            response.sendRedirect("/login");
        }
    }
}