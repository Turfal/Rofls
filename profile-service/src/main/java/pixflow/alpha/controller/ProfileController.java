package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.service.ProfileService;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDTO> getProfileByUserId(@PathVariable Long userId) {
        ProfileDTO profileDTO = profileService.getProfileByUserId(userId);
        if (profileDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profileDTO);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<ProfileDTO> getProfileByUsername(@PathVariable String username) {
        ProfileDTO profileDTO = profileService.getProfileByUsername(username);
        if (profileDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profileDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDTO> getMyProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        ProfileDTO profileDTO = profileService.getProfileByUsername(principal.getName());
        if (profileDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(profileDTO);
    }

    @GetMapping("/top")
    public ResponseEntity<List<ProfileDTO>> getTopProfiles(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(profileService.getTopProfiles(limit));
    }
}