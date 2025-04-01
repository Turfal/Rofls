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
        loadPosts();
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
            mediaUrl = mediaData.mediaUrl;
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
// Load Posts
function loadPosts() {
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
            const postsContainer = document.getElementById('postsContainer');
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post-item');
                let postContent = `
                        <div class="post-header">
                            <div class="post-avatar">${post.username[0].toUpperCase()}</div>
                            <div class="post-author-info">
                                <div class="post-author">${post.username}</div>
                                <div class="post-time">${formatDate(post.createdAt)}</div>
                            </div>
                        </div>
                        <div class="post-content">${post.content}</div>
                    `;

                // Проверяем наличие медиа и его тип
                if (post.mediaUrl) {
                    if (post.mediaType === 'image') {
                        postContent += `
                            <div class="post-media">
                                <img src="${post.mediaUrl}" alt="Post image">
                            </div>
                        `;
                    } else if (post.mediaType === 'video') {
                        postContent += `
                            <div class="post-media">
                                <video controls width="100%">
                                    <source src="${post.mediaUrl}" type="video/mp4">
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
                                    <span class="comment-icon">💬</span> Comment
                                </button>
                                ${post.username === document.getElementById('username').textContent
                    ? `<button class="delete-post-btn" data-id="${post.id}">
                                        <span class="delete-icon">🗑️</span> Delete
                                    </button>`
                    : ''}
                            </div>
                        </div>
                    `;
                postElement.innerHTML = postContent;
                postsContainer.appendChild(postElement);
            });
            // Like button functionality (client-side only for now)
            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const postId = e.target.closest('button').getAttribute('data-id');
                    const likeCountSpan = btn.querySelector('.like-count');
                    let likeCount = parseInt(likeCountSpan.textContent);
                    if (btn.classList.contains('liked')) {
                        btn.classList.remove('liked');
                        likeCountSpan.textContent = likeCount - 1;
                    } else {
                        btn.classList.add('liked');
                        likeCountSpan.textContent = likeCount + 1;
                    }
                });
            });
            document.querySelectorAll('.comment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const postId = e.target.closest('button').getAttribute('data-id');
                    // Implement comment functionality here
                });
            });
            document.querySelectorAll('.delete-post-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const postId = e.target.closest('button').getAttribute('data-id');
                    postIdToDelete = postId;
                    document.getElementById('deleteModal').style.display = 'flex';
                });
            });
        })
        .catch(error => {
            console.error('Error loading posts:', error);
        });
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}
// Delete Post
let postIdToDelete = null;

document.getElementById('confirmDelete').addEventListener('click', () => {
    if (postIdToDelete) {
        // Первый запрос: удаление медиафайла
        fetch(`media/delete/${postIdToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(mediaResponse => {
                if (!mediaResponse.ok) {
                    throw new Error('Failed to delete media');
                }
                // Второй запрос: удаление поста
                return fetch(`/posts/${postIdToDelete}`, {
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
                // Успешное удаление
                loadPosts();
                alert('Post and media deleted successfully');
            })
            .catch(error => {
                console.error('Error:', error);
                alert(`Failed to delete: ${error.message}`);
            })
            .finally(() => {
                // Закрытие модального окна и сброс переменной
                document.getElementById('deleteModal').style.display = 'none';
                postIdToDelete = null;
            });
    }
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    // Закрытие модального окна без удаления
    document.getElementById('deleteModal').style.display = 'none';
    postIdToDelete = null;
});

// Initial load
document.addEventListener('DOMContentLoaded', loadPosts);