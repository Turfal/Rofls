package pixflow.alpha.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import pixflow.alpha.dto.CreatePostDTO;
import pixflow.alpha.dto.PostDTO;
import pixflow.alpha.model.Post;
import pixflow.alpha.repository.PostRepository;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;

    public PostDTO createPost(CreatePostDTO createPostDTO) {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        // Validate input
        if ((createPostDTO.getContent() == null || createPostDTO.getContent().trim().isEmpty()) &&
                (createPostDTO.getMediaUrl() == null || createPostDTO.getMediaUrl().trim().isEmpty())) {
            throw new RuntimeException("Post must have either text content or media");
        }

        // Create post
        Post post = new Post();
        post.setUsername(username);
        post.setContent(createPostDTO.getContent());
        post.setMediaUrl(createPostDTO.getMediaUrl());
        post.setMediaType(createPostDTO.getMediaType()); // Установка типа медиа

        Post savedPost = postRepository.save(post);
        return convertToDTO(savedPost);
    }

    public List<PostDTO> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PostDTO> getPostsByUser(String username) {
        return postRepository.findByUsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deletePost(Long id) {
        // Get username from request attributes
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        String username = (String) request.getAttribute("username");

        if (username == null) {
            throw new RuntimeException("User is not authenticated");
        }

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        postRepository.delete(post);
    }

    private PostDTO convertToDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId());
        dto.setUsername(post.getUsername());
        dto.setContent(post.getContent());
        dto.setMediaUrl(post.getMediaUrl());
        dto.setMediaType(post.getMediaType());
        dto.setCreatedAt(post.getCreatedAt());
        return dto;
    }
}