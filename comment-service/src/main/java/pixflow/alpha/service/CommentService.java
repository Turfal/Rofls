package pixflow.alpha.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import pixflow.alpha.dto.CommentDTO;
import pixflow.alpha.dto.CreateCommentDTO;
import pixflow.alpha.model.Comment;
import pixflow.alpha.repository.CommentRepository;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;

    public CommentDTO createComment(CreateCommentDTO createCommentDTO) {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        // Validate input
        if (createCommentDTO.getPostId() == null) {
            throw new RuntimeException("Post ID must be provided");
        }

        if (createCommentDTO.getContent() == null || createCommentDTO.getContent().trim().isEmpty()) {
            throw new RuntimeException("Comment content cannot be empty");
        }

        // Create comment
        Comment comment = new Comment();
        comment.setPostId(createCommentDTO.getPostId());
        comment.setUsername(username);
        comment.setContent(createCommentDTO.getContent());

        Comment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }

    public List<CommentDTO> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<CommentDTO> getCommentsByUser(String username) {
        return commentRepository.findByUsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteComment(Long id) {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);
    }

    public long getCommentCount(Long postId) {
        return commentRepository.countByPostId(postId);
    }

    private CommentDTO convertToDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPostId());
        dto.setUsername(comment.getUsername());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }
}