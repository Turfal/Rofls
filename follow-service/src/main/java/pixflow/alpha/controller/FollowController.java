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
import pixflow.alpha.dto.RelationshipDTO;
import pixflow.alpha.service.RelationshipService;

import java.util.List;

@RestController
@RequestMapping("/follows")
@RequiredArgsConstructor
@Tag(name = "Follow API", description = "Endpoints for managing follows")
public class FollowController {

    private final RelationshipService relationshipService;

    @PostMapping("/{username}")
    @Operation(summary = "Follow a user", description = "Create a new follow relationship with the specified user")
    @ApiResponse(responseCode = "201", description = "Successfully followed the user")
    @ApiResponse(responseCode = "400", description = "Already following the user")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<RelationshipDTO> followUser(
            @Parameter(description = "Username of the user to follow") @PathVariable String username,
            HttpServletRequest request) {

        String followerUsername = (String) request.getAttribute("username");
        if (followerUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Prevent self-following
        if (followerUsername.equals(username)) {
            return ResponseEntity.badRequest().build();
        }

        RelationshipDTO relationship = relationshipService.followUser(followerUsername, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(relationship);
    }

    @DeleteMapping("/{username}")
    @Operation(summary = "Unfollow a user", description = "Remove a follow relationship with the specified user")
    @ApiResponse(responseCode = "204", description = "Successfully unfollowed the user")
    @ApiResponse(responseCode = "400", description = "Not following the user")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<Void> unfollowUser(
            @Parameter(description = "Username of the user to unfollow") @PathVariable String username,
            HttpServletRequest request) {

        String followerUsername = (String) request.getAttribute("username");
        if (followerUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        relationshipService.unfollowUser(followerUsername, username);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/following")
    @Operation(summary = "Get following list", description = "Get list of users that the current user is following")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved following list",
            content = @Content(schema = @Schema(implementation = RelationshipDTO.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<List<RelationshipDTO>> getFollowing(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<RelationshipDTO> following = relationshipService.getFollowing(username);
        return ResponseEntity.ok(following);
    }

    @GetMapping("/followers")
    @Operation(summary = "Get followers list", description = "Get list of users that follow the current user")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved followers list",
            content = @Content(schema = @Schema(implementation = RelationshipDTO.class)))
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<List<RelationshipDTO>> getFollowers(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<RelationshipDTO> followers = relationshipService.getFollowers(username);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/user/{username}/following")
    @Operation(summary = "Get user's following list", description = "Get list of users that the specified user is following")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved following list")
    public ResponseEntity<List<RelationshipDTO>> getUserFollowing(
            @Parameter(description = "Username to get following for") @PathVariable String username) {

        List<RelationshipDTO> following = relationshipService.getFollowing(username);
        return ResponseEntity.ok(following);
    }

    @GetMapping("/user/{username}/followers")
    @Operation(summary = "Get user's followers list", description = "Get list of users that follow the specified user")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved followers list")
    public ResponseEntity<List<RelationshipDTO>> getUserFollowers(
            @Parameter(description = "Username to get followers for") @PathVariable String username) {

        List<RelationshipDTO> followers = relationshipService.getFollowers(username);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/check/{username}")
    @Operation(summary = "Check follow status", description = "Check if current user is following the specified user")
    @ApiResponse(responseCode = "200", description = "Successfully checked follow status")
    @ApiResponse(responseCode = "401", description = "Unauthorized request")
    public ResponseEntity<Boolean> isFollowing(
            @Parameter(description = "Username to check follow status for") @PathVariable String username,
            HttpServletRequest request) {

        String followerUsername = (String) request.getAttribute("username");
        if (followerUsername == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean following = relationshipService.isFollowing(followerUsername, username);
        return ResponseEntity.ok(following);
    }
}