package pixflow.alpha.dto;

import lombok.Data;

@Data
public class RepostDTO {
    private Long postId;           // ID of the post to be reposted
    private Long conversationId;   // ID of the conversation to repost to
}