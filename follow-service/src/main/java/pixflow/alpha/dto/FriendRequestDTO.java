package pixflow.alpha.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pixflow.alpha.model.FriendRequest;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDTO {
    private Long id;
    private String requesterUsername;
    private String recipientUsername;
    private LocalDateTime createdAt;
    private FriendRequest.RequestStatus status;
}