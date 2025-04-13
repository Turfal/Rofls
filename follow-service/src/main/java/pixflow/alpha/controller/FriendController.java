package pixflow.alpha.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.FriendRequestDTO;
import pixflow.alpha.dto.RelationshipDTO;
import pixflow.alpha.service.FriendRequestService;
import pixflow.alpha.service.RelationshipService;

import java.util.List;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
@Tag(name = "Friend API", description = "Endpoints for managing friends and friend requests")
public class FriendController {

    private final RelationshipService relationshipService;
    private final FriendRequestService friendRequestService;

    @GetMapping
    @Operation(summary = "Get friends list", description = "Get list of the current user's friends")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved friends list",
            content = @Content(schema = @Schema(implementation = RelationshipDTO.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<List<RelationshipDTO>> getFriends(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<RelationshipDTO> friends = relationshipService.getFriends(username);
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/user/{username}")
    @Operation(summary = "Get user's friends list", description = "Get list of the specified user's friends")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved friends list")
    public ResponseEntity<List<RelationshipDTO>> getUserFriends(
            @Parameter(description = "Username to get friends for") @PathVariable String username) {

        List<RelationshipDTO> friends = relationshipService.getFriends(username);
        return ResponseEntity.ok(friends);
    }

    @DeleteMapping("/{username}")
    @Operation(summary = "Remove friend", description = "Remove a friendship with the specified user")
    @ApiResponse(responseCode = "204", description = "Successfully removed friend")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<Void> removeFriend(
            @Parameter(description = "Username of the friend to remove") @PathVariable String username,
            HttpServletRequest request) {

        String currentUsername = (String) request.getAttribute("username");
        if (currentUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        relationshipService.removeFriendship(currentUsername, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{username}")
    @Operation(summary = "Check friend status", description = "Check if current user is friends with the specified user")
    @ApiResponse(responseCode = "200", description = "Successfully checked friend status")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<Boolean> areFriends(
            @Parameter(description = "Username to check friend status with") @PathVariable String username,
            HttpServletRequest request) {

        String currentUsername = (String) request.getAttribute("username");
        if (currentUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean areFriends = relationshipService.areFriends(currentUsername, username);
        return ResponseEntity.ok(areFriends);
    }

    @PostMapping("/requests/{username}")
    @Operation(summary = "Send friend request", description = "Send a friend request to the specified user")
    @ApiResponse(responseCode = "201", description = "Successfully sent friend request")
    @ApiResponse(responseCode = "400", description = "Already sent a request or users are already friends")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<FriendRequestDTO> sendFriendRequest(
            @Parameter(description = "Username to send friend request to") @PathVariable String username,
            HttpServletRequest request) {

        String requesterUsername = (String) request.getAttribute("username");
        if (requesterUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Prevent self-request
        if (requesterUsername.equals(username)) {
            return ResponseEntity.badRequest().build();
        }

        FriendRequestDTO friendRequest = friendRequestService.sendFriendRequest(requesterUsername, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(friendRequest);
    }

    @GetMapping("/requests/pending")
    @Operation(summary = "Get pending friend requests", description = "Get list of pending friend requests received by the current user")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved pending requests list",
            content = @Content(schema = @Schema(implementation = FriendRequestDTO.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<List<FriendRequestDTO>> getPendingRequests(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<FriendRequestDTO> pendingRequests = friendRequestService.getPendingRequests(username);
        return ResponseEntity.ok(pendingRequests);
    }

    @GetMapping("/requests/sent")
    @Operation(summary = "Get sent friend requests", description = "Get list of friend requests sent by the current user")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved sent requests list",
            content = @Content(schema = @Schema(implementation = FriendRequestDTO.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<List<FriendRequestDTO>> getSentRequests(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<FriendRequestDTO> sentRequests = friendRequestService.getSentRequests(username);
        return ResponseEntity.ok(sentRequests);
    }

    @PostMapping("/requests/{requestId}/accept")
    @Operation(summary = "Accept friend request", description = "Accept a pending friend request")
    @ApiResponse(responseCode = "200", description = "Successfully accepted request")
    @ApiResponse(responseCode = "400", description = "Request not found or not pending")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    @ApiResponse(responseCode = "403", description = "Only the recipient can accept the request")
    public ResponseEntity<FriendRequestDTO> acceptFriendRequest(
            @Parameter(description = "ID of the friend request to accept") @PathVariable Long requestId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        FriendRequestDTO acceptedRequest = friendRequestService.acceptFriendRequest(requestId, username);
        return ResponseEntity.ok(acceptedRequest);
    }

    @PostMapping("/requests/{requestId}/reject")
    @Operation(summary = "Reject friend request", description = "Reject a pending friend request")
    @ApiResponse(responseCode = "200", description = "Successfully rejected request")
    @ApiResponse(responseCode = "400", description = "Request not found or not pending")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    @ApiResponse(responseCode = "403", description = "Only the recipient can reject the request")
    public ResponseEntity<FriendRequestDTO> rejectFriendRequest(
            @Parameter(description = "ID of the friend request to reject") @PathVariable Long requestId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        FriendRequestDTO rejectedRequest = friendRequestService.rejectFriendRequest(requestId, username);
        return ResponseEntity.ok(rejectedRequest);
    }

    @DeleteMapping("/requests/{requestId}")
    @Operation(summary = "Cancel friend request", description = "Cancel a sent friend request")
    @ApiResponse(responseCode = "204", description = "Successfully cancelled request")
    @ApiResponse(responseCode = "400", description = "Request not found")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    @ApiResponse(responseCode = "403", description = "Only the requester can cancel the request")
    public ResponseEntity<Void> cancelFriendRequest(
            @Parameter(description = "ID of the friend request to cancel") @PathVariable Long requestId,
            HttpServletRequest request) {

        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        friendRequestService.cancelFriendRequest(requestId, username);
        return ResponseEntity.noContent().build();
    }
}