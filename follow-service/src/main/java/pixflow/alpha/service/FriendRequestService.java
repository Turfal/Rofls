package pixflow.alpha.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pixflow.alpha.dto.FriendRequestDTO;
import pixflow.alpha.model.FriendRequest;
import pixflow.alpha.repository.FriendRequestRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendRequestService {

    private final FriendRequestRepository friendRequestRepository;
    private final RelationshipService relationshipService;

    public FriendRequestDTO sendFriendRequest(String requesterUsername, String recipientUsername) {
        // Check if a request already exists
        if (friendRequestRepository.existsByRequesterUsernameAndRecipientUsername(
                requesterUsername, recipientUsername)) {
            throw new IllegalStateException("Friend request already sent");
        }

        // Check if users are already friends
        if (relationshipService.areFriends(requesterUsername, recipientUsername)) {
            throw new IllegalStateException("Users are already friends");
        }

        // Create new friend request
        FriendRequest friendRequest = FriendRequest.builder()
                .requesterUsername(requesterUsername)
                .recipientUsername(recipientUsername)
                .status(FriendRequest.RequestStatus.PENDING)
                .build();

        friendRequest = friendRequestRepository.save(friendRequest);
        return mapToDTO(friendRequest);
    }

    public List<FriendRequestDTO> getPendingRequests(String username) {
        return friendRequestRepository.findByRecipientUsernameAndStatus(
                        username, FriendRequest.RequestStatus.PENDING)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<FriendRequestDTO> getSentRequests(String username) {
        return friendRequestRepository.findByRequesterUsername(username)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public FriendRequestDTO acceptFriendRequest(Long requestId, String username) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        // Check if user is the recipient
        if (!request.getRecipientUsername().equals(username)) {
            throw new IllegalStateException("Only the recipient can accept the request");
        }

        // Check if request is pending
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending");
        }

        // Update request status
        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        request = friendRequestRepository.save(request);

        // Create friendship relationship
        relationshipService.createFriendship(
                request.getRequesterUsername(),
                request.getRecipientUsername());

        return mapToDTO(request);
    }

    @Transactional
    public FriendRequestDTO rejectFriendRequest(Long requestId, String username) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        // Check if user is the recipient
        if (!request.getRecipientUsername().equals(username)) {
            throw new IllegalStateException("Only the recipient can reject the request");
        }

        // Check if request is pending
        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request is not pending");
        }

        // Update request status
        request.setStatus(FriendRequest.RequestStatus.REJECTED);
        request = friendRequestRepository.save(request);

        return mapToDTO(request);
    }

    @Transactional
    public void cancelFriendRequest(Long requestId, String username) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        // Check if user is the requester
        if (!request.getRequesterUsername().equals(username)) {
            throw new IllegalStateException("Only the requester can cancel the request");
        }

        // Delete the request
        friendRequestRepository.delete(request);
    }

    private FriendRequestDTO mapToDTO(FriendRequest friendRequest) {
        return FriendRequestDTO.builder()
                .id(friendRequest.getId())
                .requesterUsername(friendRequest.getRequesterUsername())
                .recipientUsername(friendRequest.getRecipientUsername())
                .createdAt(friendRequest.getCreatedAt())
                .status(friendRequest.getStatus())
                .build();
    }
}