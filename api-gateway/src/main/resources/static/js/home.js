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
        // alert('Your session has expired. Please login again.');
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
const postImageUpload = document.getElementById('postImageUpload');
const attachImageBtn = document.getElementById('attachImageBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImageBtn');
const submitPostBtn = document.getElementById('submitPost');
let selectedImage = null;
createPostBtn.addEventListener('click', () => {
    postModal.style.display = 'flex';
    postTextArea.focus();
});
cancelPostBtn.addEventListener('click', () => {
    postModal.style.display = 'none';
    resetPostForm();
});
postTextArea.addEventListener('input', () => {
    const length = postTextArea.value.length;
    charCount.textContent = length;
    charCount.style.color = length > 220 ? '#ff4d4d' : '#888';
});
attachImageBtn.addEventListener('click', () => {
    postImageUpload.click();
});
postImageUpload.addEventListener('change', () => {
    const file = postImageUpload.files[0];
    if (file) {
        selectedImage = file;
        previewImg.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
    }
});
removeImageBtn.addEventListener('click', () => {
    selectedImage = null;
    postImageUpload.value = '';
    imagePreview.style.display = 'none';
});
submitPostBtn.addEventListener('click', async () => {
    const postText = postTextArea.value.trim();
    if (!postText && !selectedImage) {
        alert('Please enter text or attach an image');
        return;
    }
    try {
        let imageUrl = null;
        if (selectedImage) {
            const formData = new FormData();
            formData.append('file', selectedImage);
            const response = await fetch('/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload image');
            const imageData = await response.json();
            imageUrl = imageData.imageUrl;
        }
        const postData = { content: postText, imageUrl };
        const postResponse = await fetch('/posts/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(postData)
        });
        if (!postResponse.ok) throw new Error('Failed to create post');
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
    selectedImage = null;
    postImageUpload.value = '';
    imagePreview.style.display = 'none';
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
                if (post.imageUrl) {
                    postContent += `
                            <div class="post-image">
                                <img src="${post.imageUrl}" alt="Post image">
                            </div>
                        `;
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