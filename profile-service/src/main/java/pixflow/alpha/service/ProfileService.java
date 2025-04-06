package pixflow.alpha.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pixflow.alpha.dto.ProfileDTO;
import pixflow.alpha.dto.ProfileUpdateDTO;
import pixflow.alpha.model.Profile;
import pixflow.alpha.repository.ProfileRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileDTO getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public ProfileDTO getProfileByUsername(String username) {
        return profileRepository.findByUsername(username)
                .map(this::convertToDTO)
                .orElse(null);
    }

    public List<ProfileDTO> getTopProfiles(int limit) {
        return profileRepository.findAll().stream()
                .sorted((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()))
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProfileDTO createProfile(Long userId, String username) {
        Profile profile = new Profile();
        profile.setUserId(userId);
        profile.setUsername(username);
        profile.setJoinDate(LocalDateTime.now());
        profile.setLastActive(LocalDateTime.now());

        Profile savedProfile = profileRepository.save(profile);
        return convertToDTO(savedProfile);
    }

    public ProfileDTO updateProfile(Long userId, ProfileUpdateDTO profileUpdateDTO) {
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return null;
        }

        if (profileUpdateDTO.getBio() != null) {
            profile.setBio(profileUpdateDTO.getBio());
        }

        if (profileUpdateDTO.getAvatarUrl() != null) {
            profile.setAvatarUrl(profileUpdateDTO.getAvatarUrl());
        }

        profile.setLastActive(LocalDateTime.now());
        Profile updatedProfile = profileRepository.save(profile);
        return convertToDTO(updatedProfile);
    }

    public void updateStatistics(Long userId, int postsChange, int commentsChange, int upvotesChange, int downvotesChange) {
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return;
        }

        profile.setPostsCount(profile.getPostsCount() + postsChange);
        profile.setCommentsCount(profile.getCommentsCount() + commentsChange);
        profile.setTotalUpvotes(profile.getTotalUpvotes() + upvotesChange);
        profile.setTotalDownvotes(profile.getTotalDownvotes() + downvotesChange);
        profile.setLastActive(LocalDateTime.now());

        profileRepository.save(profile);
    }

    public void updateRating(Long userId, int ratingChange) {
        Profile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return;
        }

        profile.setRating(profile.getRating() + ratingChange);
        profile.setLastActive(LocalDateTime.now());

        profileRepository.save(profile);
    }

    private ProfileDTO convertToDTO(Profile profile) {
        ProfileDTO dto = new ProfileDTO();
        dto.setUserId(profile.getUserId());
        dto.setUsername(profile.getUsername());
        dto.setBio(profile.getBio());
        dto.setRating(profile.getRating());
        dto.setPostsCount(profile.getPostsCount());
        dto.setCommentsCount(profile.getCommentsCount());
        dto.setAvatarUrl(profile.getAvatarUrl());
        dto.setJoinDate(profile.getJoinDate());
        dto.setLastActive(profile.getLastActive());
        dto.setTotalUpvotes(profile.getTotalUpvotes());
        dto.setTotalDownvotes(profile.getTotalDownvotes());
        dto.setAchievementsCount(profile.getAchievementsCount());
        return dto;
    }
}