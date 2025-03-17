package pixflow.alpha.service;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class SessionStorage {
    private final Map<String, String> sessions = new HashMap<>();

    public String createSession(String username) {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, username);
        return sessionId;
    }

    public boolean validateSession(String sessionId) {
        return sessions.containsKey(sessionId);
    }

    public void removeSession(String sessionId) {
        sessions.remove(sessionId);
    }

    public String getUsernameFromSession(String sessionId) {
        return sessions.get(sessionId);
    }
}
