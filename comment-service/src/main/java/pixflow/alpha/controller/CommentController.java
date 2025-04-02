package pixflow.alpha.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pixflow.alpha.dto.CommentDTO;
import pixflow.alpha.dto.CreateCommentDTO;
import pixflow.alpha.service.CommentService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/create")
    public ResponseEntity<CommentDTO> createComment(@RequestBody CreateCommentDTO createCommentDTO) {
        return ResponseEntity.ok(commentService.createComment(createCommentDTO));
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<CommentDTO>> getCommentsByUser(@PathVariable String username) {
        return ResponseEntity.ok(commentService.getCommentsByUser(username));
    }

    @GetMapping("/count/{postId}")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentCount(postId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}