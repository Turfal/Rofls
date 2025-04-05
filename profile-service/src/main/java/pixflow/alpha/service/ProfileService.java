package pixflow.alpha.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pixflow.alpha.client.UserServiceClient;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.dto.UserDTO;
import pixflow.alpha.model.Profile;
import pixflow.alpha.repository.ProfileRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final UserServiceClient userServiceClient;

    public ProfileDTO getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(Profile::toDTO)
                .orElseGet(() -> createProfileFromUser(userId));
    }

    public ProfileDTO getProfileByUsername(String username) {
        return profileRepository.findByUsername(username)
                .map(Profile::toDTO)
                .orElse(null);
    }

    private ProfileDTO createProfileFromUser(Long userId) {
        try {
            UserDTO userDTO = userServiceClient.getUser(userId);
            if (userDTO != null) {
                Profile profile = new Profile();
                profile.setUserId(userDTO.getId());
                profile.setUsername(userDTO.getUsername());
                profile.setBio(userDTO.getBio());
                profile.setRating(userDTO.getRating());

                Profile savedProfile = profileRepository.save(profile);
                return savedProfile.toDTO();
            }
        } catch (Exception e) {
            // Log error
        }
        return null;
    }

    public void incrementPostsCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setPostsCount(profile.getPostsCount() + 1);
            profileRepository.save(profile);
        });
    }

    public void decrementPostsCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            if (profile.getPostsCount() > 0) {
                profile.setPostsCount(profile.getPostsCount() - 1);
                profileRepository.save(profile);
            }
        });
    }

    public List<ProfileDTO> getTopProfiles(int limit) {
        return profileRepository.findAll().stream()
                .sorted((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()))
                .limit(limit)
                .map(Profile::toDTO)
                .collect(Collectors.toList());
    }
}