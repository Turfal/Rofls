package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.FriendRequest;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    List<FriendRequest> findByRequesterUsername(String requesterUsername);

    List<FriendRequest> findByRecipientUsername(String recipientUsername);

    List<FriendRequest> findByRecipientUsernameAndStatus(String recipientUsername, FriendRequest.RequestStatus status);

    Optional<FriendRequest> findByRequesterUsernameAndRecipientUsername(String requesterUsername, String recipientUsername);

    boolean existsByRequesterUsernameAndRecipientUsername(String requesterUsername, String recipientUsername);
}
