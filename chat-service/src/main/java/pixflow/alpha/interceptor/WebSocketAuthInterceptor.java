package pixflow.alpha.interceptor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import pixflow.alpha.util.JwtUtil;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            log.debug("WebSocket Authorization: {}", authorization);

            if (authorization != null && !authorization.isEmpty()) {
                String jwt = authorization.get(0).replace("Bearer ", "");
                try {
                    String username = jwtUtil.extractUsername(jwt);
                    if (username != null) {
                        log.debug("WebSocket connected username: {}", username);

                        // Store username in session
                        accessor.setUser(() -> username);
                    }
                } catch (Exception e) {
                    log.error("Invalid JWT token in WebSocket connection", e);
                }
            }
        }

        return message;
    }
}