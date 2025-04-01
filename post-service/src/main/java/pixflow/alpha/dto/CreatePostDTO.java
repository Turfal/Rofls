package pixflow.alpha.dto;

import lombok.Data;

@Data
public class CreatePostDTO {
    private String content;
    private String mediaUrl;
    private String mediaType; // Добавлено поле для типа медиа (image или video)
}