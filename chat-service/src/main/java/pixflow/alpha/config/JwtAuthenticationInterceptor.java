package pixflow.alpha.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import pixflow.alpha.util.JwtUtil;

import java.util.List;

@Component
public class JwtAuthenticationInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");

            if (authorization != null && !authorization.isEmpty()) {
                String token = authorization.get(0).startsWith("Bearer ")
                        ? authorization.get(0).substring(7)
                        : authorization.get(0);

                if (jwtUtil.validateToken(token)) {
                    Long userId = jwtUtil.extractUserId(token);
                    String username = jwtUtil.extractUsername(token);

                    // Store user information in headers
                    accessor.setUser(new ChatPrincipal(userId, username));
                } else {
                    throw new RuntimeException("Invalid JWT token");
                }
            } else {
                throw new RuntimeException("Authorization header is missing");
            }
        }

        return message;
    }
}