package pixflow.alpha.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pixflow.alpha.model.MediaPost;
import java.util.List;

@Repository
public interface MediaPostRepository extends JpaRepository<MediaPost, Long> {
    List<MediaPost> findAllByOrderByCreatedAtDesc();
}