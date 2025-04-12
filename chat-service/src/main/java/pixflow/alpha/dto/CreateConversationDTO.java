package pixflow.alpha.dto;

import lombok.Data;

import java.util.Set;

@Data
public class CreateConversationDTO {
    private String title;
    private Set<String> participants;
}