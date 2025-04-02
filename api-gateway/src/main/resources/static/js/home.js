const token = localStorage.getItem('jwt_token');
if (!token) {
    window.location.href = '/login';
}

// Fetch user data
fetch('/auth/me', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
})
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch user data');
        return response.json();
    })
    .then(data => {
        document.getElementById('username').textContent = data.username;
    })
    .catch(() => {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
    });

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login?logout=true';
});

// Post Modal functionality
const postModal = document.getElementById('postModal');
const createPostBtn = document.getElementById('createPostBtn');
const cancelPostBtn = document.getElementById('cancelPost');
const postTextArea = document.getElementById('postText');
const charCount = document.getElementById('charCount');
const postMediaUpload = document.getElementById('postMediaUpload');
const attachMediaBtn = document.getElementById('attachImageBtn');
const mediaPreview = document.getElementById('mediaPreview');
const previewContainer = document.getElementById('previewContainer');
const removeMediaBtn = document.getElementById('removeMediaBtn');
const submitPostBtn = document.getElementById('submitPost');
let selectedMedia = null;
let mediaType = null;

// Check if elements exist
if (!postModal) console.error('postModal not found');
if (!createPostBtn) console.error('createPostBtn not found');
if (!cancelPostBtn) console.error('cancelPostBtn not found');
if (!postTextArea) console.error('postTextArea not found');
if (!charCount) console.error('charCount not found');
if (!postMediaUpload) console.error('postMediaUpload not found');
if (!attachMediaBtn) console.error('attachMediaBtn not found');
if (!mediaPreview) console.error('mediaPreview not found');
if (!previewContainer) console.error('previewContainer not found');
if (!removeMediaBtn) console.error('removeMediaBtn not found');
if (!submitPostBtn) console.error('submitPostBtn not found');

createPostBtn.addEventListener('click', () => {
    console.log('Create Post button clicked');
    postModal.style.display = 'flex';
    postTextArea.focus();
});

cancelPostBtn.addEventListener('click', () => {
    console.log('Cancel Post button clicked');
    postModal.style.display = 'none';
    resetPostForm();
});

postTextArea.addEventListener('input', () => {
    const length = postTextArea.value.length;
    charCount.textContent = length;
    charCount.style.color = length > 220 ? '#ff4d4d' : '#888';
});

attachMediaBtn.addEventListener('click', () => {
    console.log('Attach Media button clicked');
    if (!postMediaUpload) {
        console.error('postMediaUpload element not found');
        return;
    }
    postMediaUpload.click();
});

postMediaUpload.addEventListener('change', () => {
    console.log('File input changed');
    const file = postMediaUpload.files[0];
    if (file) {
        console.log('Selected file:', file);
        selectedMedia = file;

        if (file.type.startsWith('image/')) {
            mediaType = 'image';
            previewContainer.innerHTML = `<img id="previewImg" src="${URL.createObjectURL(file)}" alt="Preview">`;
        } else if (file.type.startsWith('video/')) {
            mediaType = 'video';
            previewContainer.innerHTML = `
                    <video id="previewVideo" controls>
                        <source src="${URL.createObjectURL(file)}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>`;
        } else {
            console.warn('Unsupported file type:', file.type);
        }

        if (!previewContainer) {
            console.error('previewContainer element not found');
            return;
        }
        if (!mediaPreview) {
            console.error('mediaPreview element not found');
            return;
        }
        mediaPreview.style.display = 'block';
    } else {
        console.log('No file selected');
    }
});

removeMediaBtn.addEventListener('click', () => {
    console.log('Remove Media button clicked');
    selectedMedia = null;
    mediaType = null;
    postMediaUpload.value = '';
    if (!mediaPreview) {
        console.error('mediaPreview element not found');
        return;
    }
    if (!previewContainer) {
        console.error('previewContainer element not found');
        return;
    }
    mediaPreview.style.display = 'none';
    previewContainer.innerHTML = '';
});

submitPostBtn.addEventListener('click', async () => {
    console.log('Submit Post button clicked');
    const postText = postTextArea.value.trim();
    if (!postText && !selectedMedia) {
        alert('Please enter text or attach media');
        return;
    }
    try {
        let mediaUrl = null;
        if (selectedMedia) {
            console.log('Uploading media:', selectedMedia);
            const formData = new FormData();
            formData.append('file', selectedMedia);
            const response = await fetch('/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                console.error('Media upload failed:', response.status, response.statusText);
                throw new Error('Failed to upload media');
            }
            const mediaData = await response.json();
            console.log('Media upload response:', mediaData);
            mediaUrl = mediaData.imageUrl;
        }

        const postData = {
            content: postText,
            mediaUrl: mediaUrl,
            mediaType: mediaType
        };
        console.log('Post data to be sent:', postData);

        const postResponse = await fetch('/posts/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        if (!postResponse.ok) {
            console.error('Post creation failed:', postResponse.status, postResponse.statusText);
            throw new Error('Failed to create post');
        }
        console.log('Post created successfully');
        postModal.style.display = 'none';
        resetPostForm();
        loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
});

function resetPostForm() {
    postTextArea.value = '';
    charCount.textContent = '0';
    charCount.style.color = '#888';
    selectedMedia = null;
    mediaType = null;
    postMediaUpload.value = '';
    mediaPreview.style.display = 'none';
    previewContainer.innerHTML = '';
}

// Format media URL correctly for display
function getFormattedMediaUrl(mediaUrl) {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith('/media/files/')) {
        return mediaUrl;
    }
    const parts = mediaUrl.split('/');
    const filename = parts[parts.length - 1];
    return `/media/files/${filename}`;
}

// Comments
function loadComments(postId) {
    fetch(`/comments/post/${postId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch comments');
            return response.json();
        })
        .then(comments => {
            const commentsList = document.getElementById(`comments-list-${postId}`);
            commentsList.innerHTML = '';

            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
                return;
            }

            const initialComments = comments.slice(0, 5);
            const remainingComments = comments.slice(5);

            initialComments.forEach(comment => {
                const commentElement = createCommentElement(comment, postId);
                commentsList.appendChild(commentElement);
            });

            if (remainingComments.length > 0) {
                const showMoreBtn = document.createElement('div');
                showMoreBtn.classList.add('show-more-comments');
                showMoreBtn.textContent = `View all ${comments.length} comments`;
                showMoreBtn.addEventListener('click', () => {
                    showMoreBtn.remove();
                    remainingComments.forEach(comment => {
                        const commentElement = createCommentElement(comment, postId);
                        commentsList.appendChild(commentElement);
                    });
                });
                commentsList.appendChild(showMoreBtn);
            }

            document.querySelectorAll('.delete-comment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const commentId = e.target.closest('button').getAttribute('data-id');
                    showDeleteCommentModal(commentId, postId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading comments:', error);
        });
}

function createCommentElement(comment, postId) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment-item');
    commentElement.innerHTML = `
        <div class="comment-header">
            <div class="comment-avatar">${comment.username[0].toUpperCase()}</div>
            <div class="comment-author-info">
                <div class="comment-author">${comment.username}</div>
                <div class="comment-time">${formatDate(comment.createdAt)}</div>
            </div>
            ${comment.username === document.getElementById('username').textContent
        ? `<button class="delete-comment-btn" data-id="${comment.id}">
                    <span class="delete-icon">🗑️</span>
                </button>`
        : ''}
        </div>
        <div class="comment-content">${comment.content}</div>
    `;
    return commentElement;
}

function showDeleteCommentModal(commentId, postId) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'comment-delete-modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'comment-delete-modal';
    modalContent.innerHTML = `
        <p>Are you sure you want to delete this comment?</p>
        <div class="comment-delete-buttons">
            <button id="confirm-delete-comment">Yes</button>
            <button id="cancel-delete-comment">No</button>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    document.getElementById('confirm-delete-comment').addEventListener('click', () => {
        deleteComment(commentId, postId);
        document.body.removeChild(modalOverlay);
    });

    document.getElementById('cancel-delete-comment').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
}

function deleteComment(commentId, postId) {
    fetch(`/comments/delete/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete comment');
            loadComments(postId);
            updateCommentCount(postId);
        })
        .catch(error => {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. Please try again.');
        });
}

function submitComment(postId) {
    const commentText = document.getElementById(`comment-textarea-${postId}`).value.trim();

    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    const commentData = {
        postId: postId,
        content: commentText
    };

    fetch('/comments/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(commentData)
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to post comment');
            return response.json();
        })
        .then(comment => {
            document.getElementById(`comment-textarea-${postId}`).value = '';
            loadComments(postId);
            updateCommentCount(postId);
        })
        .catch(error => {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        });
}

function updateCommentCount(postId) {
    fetch(`/comments/count/${postId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch comment count');
            return response.json();
        })
        .then(count => {
            const commentBtns = document.querySelectorAll(`.comment-btn[data-id="${postId}"]`);
            commentBtns.forEach(btn => {
                const countSpan = btn.querySelector('.comment-count');
                if (countSpan) {
                    countSpan.textContent = `(${count})`;
                }
            });
        })
        .catch(error => {
            console.error('Error updating comment count:', error);
        });
}

// Load Posts
let isLoadingPosts = false;

function loadPosts() {
    if (isLoadingPosts) return;
    isLoadingPosts = true;

    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) {
        console.error('postsContainer not found');
        isLoadingPosts = false;
        return;
    }

    postsContainer.innerHTML = '';

    fetch('/posts/all', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch posts');
            return response.json();
        })
        .then(posts => {
            const commentCountPromises = posts.map(post =>
                fetch(`/comments/count/${post.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(response => response.json())
                    .then(count => {
                        post.commentCount = count;
                        return post;
                    })
                    .catch(error => {
                        console.error(`Error fetching comment count for post ${post.id}:`, error);
                        post.commentCount = 0;
                        return post;
                    })
            );

            return Promise.all(commentCountPromises);
        })
        .then(postsWithCommentCounts => {
            postsWithCommentCounts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-item');
                postElement.setAttribute('data-post-id', post.id);

                let postContent = `
                    <div class="post-header">
                        <div class="post-avatar">${post.username[0].toUpperCase()}</div>
                        <div class="post-author-info">
                            <div class="post-author">${post.username}</div>
                            <div class="post-time">${formatDate(post.createdAt)}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content || ''}</div>
                `;

                const formattedMediaUrl = getFormattedMediaUrl(post.mediaUrl);

                if (formattedMediaUrl) {
                    if (post.mediaType === 'image') {
                        postContent += `
                            <div class="post-media">
                                <img src="${formattedMediaUrl}" alt="Post image" class="post-image">
                            </div>
                        `;
                    } else if (post.mediaType === 'video') {
                        postContent += `
                            <div class="post-media">
                                <video controls class="post-video">
                                    <source src="${formattedMediaUrl}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        `;
                    }
                }

                postContent += `
                    <div class="post-footer">
                        <div class="post-actions">
                            <button class="like-btn" data-id="${post.id}">
                                <span class="like-icon">❤️</span>
                                <span class="like-count">${post.likes || 0}</span>
                            </button>
                            <button class="comment-btn" data-id="${post.id}">
                                <span class="comment-icon">💬</span> Comments <span class="comment-count">(${post.commentCount || 0})</span>
                            </button>
                            ${post.username === document.getElementById('username').textContent
                    ? `<button class="delete-post-btn" data-id="${post.id}">
                                    <span class="delete-icon">🗑️</span> Delete
                                </button>`
                    : ''}
                        </div>
                    </div>
                    <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                        <div class="comments-list" id="comments-list-${post.id}"></div>
                        <div class="add-comment">
                            <textarea class="comment-textarea" id="comment-textarea-${post.id}" placeholder="Write a comment..."></textarea>
                            <button class="submit-comment-btn" data-id="${post.id}">Comment</button>
                        </div>
                    </div>
                `;
                postElement.innerHTML = postContent;
                postsContainer.appendChild(postElement);
            });

            addPostEventListeners();
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
        })
        .finally(() => {
            isLoadingPosts = false;
        });
}

function addPostEventListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.removeEventListener('click', handleLikeClick);
        btn.addEventListener('click', handleLikeClick);
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.removeEventListener('click', handleCommentClick);
        btn.addEventListener('click', handleCommentClick);
    });

    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.removeEventListener('click', handleSubmitComment);
        btn.addEventListener('click', handleSubmitComment);
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeletePost);
        btn.addEventListener('click', handleDeletePost);
    });
}

function handleLikeClick(e) {
    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-id');
    const likeCountSpan = btn.querySelector('.like-count');
    let likeCount = parseInt(likeCountSpan.textContent);
    if (btn.classList.contains('liked')) {
        btn.classList.remove('liked');
        likeCountSpan.textContent = likeCount - 1;
    } else {
        btn.classList.add('liked');
        likeCountSpan.textContent = likeCount + 1;
    }
}

function handleCommentClick(e) {
    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-id');
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(postId);
    } else {
        commentsSection.style.display = 'none';
    }
}

function handleSubmitComment(e) {
    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-id');
    submitComment(postId);
}

function handleDeletePost(e) {
    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-id');
    postIdToDelete = postId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Delete Post
let postIdToDelete = null;

document.getElementById('confirmDelete').addEventListener('click', () => {
    if (postIdToDelete) {
        fetch(`/comments/post/${postIdToDelete}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch comments');
                return response.json();
            })
            .then(comments => {
                // Delete each comment by its own ID
                const deleteCommentPromises = comments.map(comment =>
                    fetch(`/comments/delete/${comment.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                );

                return Promise.all(deleteCommentPromises);
            })
            .then(mediaResponse => {
                // Затем удаляем медиа, связанные с постом
                return fetch(`/media/delete/${postIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            })
            .then(commentResponse => {
                if (!commentResponse.ok) {
                    throw new Error('Failed to delete comments');
                }
                // После удаления комментариев удаляем сам пост
                return fetch(`/posts/delete/${postIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            })
            .then(postResponse => {
                if (!postResponse.ok) {
                    throw new Error('Failed to delete post');
                }
                loadPosts(); // Перезагружаем посты после успешного удаления
                alert('Post and associated comments deleted successfully');
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Failed to delete: ${error.message}`);
            })
            .finally(() => {
                document.getElementById('deleteModal').style.display = 'none';
                postIdToDelete = null;
            });
    }
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').style.display = 'none';
    postIdToDelete = null;
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    loadPosts();
});