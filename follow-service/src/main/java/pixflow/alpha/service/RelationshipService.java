package pixflow.alpha.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pixflow.alpha.dto.RelationshipDTO;
import pixflow.alpha.model.FriendRequest;
import pixflow.alpha.model.Relationship;
import pixflow.alpha.repository.FriendRequestRepository;
import pixflow.alpha.repository.RelationshipRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RelationshipService {

    private final RelationshipRepository relationshipRepository;
    private final FriendRequestRepository friendRequestRepository;

    public RelationshipDTO followUser(String followerUsername, String followingUsername) {
        // Check if already following
        if (relationshipRepository.existsByFollowerUsernameAndFollowingUsername(followerUsername, followingUsername)) {
            throw new IllegalStateException("Already following this user");
        }

        // Create new relationship
        Relationship relationship = Relationship.builder()
                .followerUsername(followerUsername)
                .followingUsername(followingUsername)
                .isFriend(false)
                .build();

        relationship = relationshipRepository.save(relationship);
        return mapToDTO(relationship);
    }

    public void unfollowUser(String followerUsername, String followingUsername) {
        relationshipRepository.findByFollowerUsernameAndFollowingUsername(
                        followerUsername, followingUsername)
                .ifPresentOrElse(
                        relationship -> relationshipRepository.delete(relationship),
                        () -> { throw new IllegalStateException("Not following this user"); }
                );
    }

    public List<RelationshipDTO> getFollowing(String username) {
        return relationshipRepository.findByFollowerUsername(username)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<RelationshipDTO> getFollowers(String username) {
        return relationshipRepository.findByFollowingUsername(username)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<RelationshipDTO> getFriends(String username) {
        // Get all friends from both directions
        List<Relationship> friends1 = relationshipRepository.findFriendsByFollowerUsername(username);
        List<Relationship> friends2 = relationshipRepository.findFriendsByFollowingUsername(username);

        // Combine the lists, avoid duplicates
        Set<RelationshipDTO> friendSet = new HashSet<>();
        friendSet.addAll(friends1.stream().map(this::mapToDTO).collect(Collectors.toSet()));
        friendSet.addAll(friends2.stream().map(this::mapToDTO).collect(Collectors.toSet()));

        return new ArrayList<>(friendSet);
    }

    public boolean isFollowing(String followerUsername, String followingUsername) {
        return relationshipRepository.existsByFollowerUsernameAndFollowingUsername(
                followerUsername, followingUsername);
    }

    public boolean areFriends(String username1, String username2) {
        // Check both directions
        return relationshipRepository.findByFollowerUsernameAndFollowingUsername(username1, username2)
                .map(Relationship::isFriend)
                .orElse(false) ||
                relationshipRepository.findByFollowerUsernameAndFollowingUsername(username2, username1)
                        .map(Relationship::isFriend)
                        .orElse(false);
    }

    @Transactional
    public void createFriendship(String username1, String username2) {
        // Check if there's already a relationship in any direction
        Relationship rel1 = relationshipRepository.findByFollowerUsernameAndFollowingUsername(
                username1, username2).orElse(null);

        Relationship rel2 = relationshipRepository.findByFollowerUsernameAndFollowingUsername(
                username2, username1).orElse(null);

        // Create relationship from user1 to user2 if it doesn't exist
        if (rel1 == null) {
            rel1 = Relationship.builder()
                    .followerUsername(username1)
                    .followingUsername(username2)
                    .isFriend(true)
                    .build();
            relationshipRepository.save(rel1);
        } else {
            rel1.setFriend(true);
            relationshipRepository.save(rel1);
        }

        // Create relationship from user2 to user1 if it doesn't exist
        if (rel2 == null) {
            rel2 = Relationship.builder()
                    .followerUsername(username2)
                    .followingUsername(username1)
                    .isFriend(true)
                    .build();
            relationshipRepository.save(rel2);
        } else {
            rel2.setFriend(true);
            relationshipRepository.save(rel2);
        }
    }

    @Transactional
    public void removeFriendship(String username1, String username2) {
        // Update both relationship directions to remove friend status
        relationshipRepository.findByFollowerUsernameAndFollowingUsername(username1, username2)
                .ifPresent(rel -> {
                    rel.setFriend(false);
                    relationshipRepository.save(rel);
                });

        relationshipRepository.findByFollowerUsernameAndFollowingUsername(username2, username1)
                .ifPresent(rel -> {
                    rel.setFriend(false);
                    relationshipRepository.save(rel);
                });
    }

    private RelationshipDTO mapToDTO(Relationship relationship) {
        return RelationshipDTO.builder()
                .id(relationship.getId())
                .followerUsername(relationship.getFollowerUsername())
                .followingUsername(relationship.getFollowingUsername())
                .createdAt(relationship.getCreatedAt())
                .isFriend(relationship.isFriend())
                .build();
    }
}