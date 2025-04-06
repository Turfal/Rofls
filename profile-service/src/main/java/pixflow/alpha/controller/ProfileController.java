package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.dto.ProfileUpdateDTO;
import pixflow.alpha.service.ProfileService;

import java.util.List;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDTO> getProfileByUserId(@PathVariable Long userId) {
        ProfileDTO profile = profileService.getProfileByUserId(userId);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<ProfileDTO> getProfileByUsername(@PathVariable String username) {
        ProfileDTO profile = profileService.getProfileByUsername(username);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/top")
    public ResponseEntity<List<ProfileDTO>> getTopProfiles(@RequestParam(defaultValue = "10") int limit) {
        List<ProfileDTO> profiles = profileService.getTopProfiles(limit);
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/{userId}")
    public ResponseEntity<ProfileDTO> createProfile(@PathVariable Long userId, @RequestParam String username) {
        ProfileDTO createdProfile = profileService.createProfile(userId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProfile);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ProfileDTO> updateProfile(
            @PathVariable Long userId,
            @RequestBody ProfileUpdateDTO profileUpdateDTO,
            @RequestAttribute(name = "username", required = false) String requestUsername) {

        // Simple authorization check - can be enhanced
        ProfileDTO currentProfile = profileService.getProfileByUserId(userId);
        if (currentProfile == null) {
            return ResponseEntity.notFound().build();
        }

        // Here, we would typically validate that the requester's username matches the profile's username
        // Since we're not using Spring Security, this is a simple check
        if (requestUsername == null || !requestUsername.equals(currentProfile.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ProfileDTO updatedProfile = profileService.updateProfile(userId, profileUpdateDTO);
        return ResponseEntity.ok(updatedProfile);
    }

    @PutMapping("/{userId}/stats")
    public ResponseEntity<?> updateStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int postsChange,
            @RequestParam(defaultValue = "0") int commentsChange,
            @RequestParam(defaultValue = "0") int upvotesChange,
            @RequestParam(defaultValue = "0") int downvotesChange) {

        profileService.updateStatistics(userId, postsChange, commentsChange, upvotesChange, downvotesChange);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{userId}/rating")
    public ResponseEntity<?> updateRating(
            @PathVariable Long userId,
            @RequestParam int ratingChange) {

        profileService.updateRating(userId, ratingChange);
        return ResponseEntity.ok().build();
    }
}