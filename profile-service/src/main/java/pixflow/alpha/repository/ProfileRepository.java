package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.Profile;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
    Optional<Profile> findByUsername(String username);
}