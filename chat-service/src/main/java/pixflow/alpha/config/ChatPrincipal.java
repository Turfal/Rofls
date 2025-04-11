package pixflow.alpha.config;

import java.security.Principal;

public class ChatPrincipal implements Principal {
    private final Long userId;
    private final String username;

    public ChatPrincipal(Long userId, String username) {
        this.userId = userId;
        this.username = username;
    }

    @Override
    public String getName() {
        return username;
    }

    public Long getUserId() {
        return userId;
    }
}