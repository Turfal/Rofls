package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.Relationship;

import java.util.List;
import java.util.Optional;

@Repository
public interface RelationshipRepository extends JpaRepository<Relationship, Long> {

    List<Relationship> findByFollowerUsername(String followerUsername);

    List<Relationship> findByFollowingUsername(String followingUsername);

    @Query("SELECT r FROM Relationship r WHERE r.followerUsername = :username OR r.followingUsername = :username")
    List<Relationship> findAllRelationshipsForUser(String username);

    @Query("SELECT r FROM Relationship r WHERE r.followerUsername = :username AND r.isFriend = true")
    List<Relationship> findFriendsByFollowerUsername(String username);

    @Query("SELECT r FROM Relationship r WHERE r.followingUsername = :username AND r.isFriend = true")
    List<Relationship> findFriendsByFollowingUsername(String username);

    Optional<Relationship> findByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);

    boolean existsByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);

    void deleteByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);
}