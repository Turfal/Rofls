const token = localStorage.getItem('jwt_token');
if (!token) {
    window.location.href = '/login';
}

let currentUser = null;
let postIdToDelete = null;
let selectedMedia = null;
let mediaType = null;
let feedType = 'forYou'; // 'forYou' или 'following'

// Fetch wrapper with authentication
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers // Сохраняем дополнительные заголовки
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('jwt_token');
            window.location.href = '/login';
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
}

// Fetch current user
async function getCurrentUser() {
    try {
        const response = await fetchWithAuth('/auth/me');
        currentUser = await response.json();
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('profileLink').href = `/profile/username/${currentUser.username}`;
    } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
searchInput.addEventListener('input', debounce(async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
    }

    try {
        const usersResponse = await fetchWithAuth(`/profiles/search?query=${encodeURIComponent(query)}`);
        const postsResponse = await fetchWithAuth(`/posts/search?query=${encodeURIComponent(query)}`);
        const users = await usersResponse.json();
        const posts = await postsResponse.json();

        searchResults.innerHTML = '';
        if (users.length === 0 && posts.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
        } else {
            users.slice(0, 5).forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'search-result-item';
                userDiv.innerHTML = `<a href="/profile/username/${user.username}">${user.username}</a>`;
                searchResults.appendChild(userDiv);
            });
            posts.slice(0, 5).forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'search-result-item';
                postDiv.innerHTML = `<a href="/post/${post.id}">${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}</a>`;
                searchResults.appendChild(postDiv);
            });
        }
        searchResults.style.display = 'block';
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="error">Search failed</div>';
    }
}, 300));

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login?logout=true';
});

// Post Modal
function setupPostModal() {
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
        charCount.style.color = length > 250 ? '#ff4d4d' : '#888';
    });

    attachMediaBtn.addEventListener('click', () => {
        postMediaUpload.click();
    });

    postMediaUpload.addEventListener('change', () => {
        const file = postMediaUpload.files[0];
        if (file) {
            selectedMedia = file;
            mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
            if (mediaType) {
                previewContainer.innerHTML = mediaType === 'image' ?
                    `<img src="${URL.createObjectURL(file)}" alt="Preview">` :
                    `<video controls><source src="${URL.createObjectURL(file)}" type="${file.type}"></video>`;
                mediaPreview.style.display = 'block';
            }
        }
    });

    removeMediaBtn.addEventListener('click', () => {
        selectedMedia = null;
        mediaType = null;
        postMediaUpload.value = '';
        mediaPreview.style.display = 'none';
        previewContainer.innerHTML = '';
    });

    submitPostBtn.addEventListener('click', async () => {
        const postText = postTextArea.value.trim();
        if (!postText && !selectedMedia) {
            alert('Please enter text or attach media');
            return;
        }
        try {
            let mediaUrl = null;
            if (selectedMedia) {
                const formData = new FormData();
                formData.append('file', selectedMedia);
                const response = await fetchWithAuth('/media/upload', { method: 'POST', body: formData });
                const mediaData = await response.json();
                mediaUrl = mediaData.imageUrl;
            }

            const postData = { content: postText, mediaUrl, mediaType };
            await fetchWithAuth('/posts/create', {
                method: 'POST',
                body: JSON.stringify(postData)
            });

            postModal.style.display = 'none';
            resetPostForm();
            loadPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post');
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
}

// Load Posts
let isLoadingPosts = false;

async function loadPosts() {
    if (isLoadingPosts) return;
    isLoadingPosts = true;

    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '<div class="loading-indicator">Loading posts...</div>';

    try {
        const url = feedType === 'forYou' ? '/posts/all' : '/posts/following';
        const response = await fetchWithAuth(url);
        const posts = await response.json();

        const postsWithComments = await Promise.all(posts.map(async post => {
            const countResponse = await fetchWithAuth(`/comments/count/${post.id}`);
            post.commentCount = await countResponse.json();
            return post;
        }));

        postsContainer.innerHTML = '';
        postsWithComments.forEach(post => {
            postsContainer.appendChild(createPostElement(post));
        });
        addPostEventListeners();
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
    } finally {
        isLoadingPosts = false;
    }
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    postElement.dataset.postId = post.id;

    const mediaUrl = getFormattedMediaUrl(post.mediaUrl);
    const mediaContent = mediaUrl ? (post.mediaType === 'image' ?
        `<img class="post-media" src="${mediaUrl}" alt="Post image">` :
        `<video class="post-media" controls><source src="${mediaUrl}" type="video/mp4"></video>`) : '';

    // Используем avatarUrl из данных поста, если есть, иначе дефолтную аватарку
    const avatarSrc = post.avatarUrl || '/media/files/raw.png';

    postElement.innerHTML = `
        <div class="post-header">
            <img class="post-avatar" src="${avatarSrc}" alt="${post.username}'s avatar">
            <div class="post-author-info">
                <a href="/profile/username/${post.username}" class="post-author">${post.username}</a>
                <div class="post-time">${formatDate(post.createdAt)}</div>
            </div>
        </div>
        <div class="post-content">${post.content || ''}</div>
        ${mediaContent}
        <div class="post-footer">
            <button class="like-btn" data-id="${post.id}">
                <span class="like-icon">❤️</span> <span class="like-count">${post.likes || 0}</span>
            </button>
            <button class="comment-btn" data-id="${post.id}">
                <span class="comment-icon">💬</span> Comments <span class="comment-count">(${post.commentCount || 0})</span>
            </button>
            ${post.username === currentUser.username ?
        `<button class="delete-post-btn" data-id="${post.id}">🗑️ Delete</button>` : ''}
        </div>
        <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <div class="add-comment">
                <textarea class="comment-textarea" id="comment-textarea-${post.id}" placeholder="Write a comment..."></textarea>
                <button class="submit-comment-btn" data-id="${post.id}">Comment</button>
            </div>
        </div>
    `;
    return postElement;
}

// Comments
async function loadComments(postId) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    try {
        const response = await fetchWithAuth(`/comments/post/${postId}`);
        const comments = await response.json();
        commentsList.innerHTML = comments.length === 0 ? '<div class="no-comments">No comments yet</div>' :
            comments.map(comment => {
                // Используем avatarUrl из данных комментария, если есть, иначе дефолтную аватарку
                const avatarSrc = comment.avatarUrl || '/media/files/raw.png';
                return `
                    <div class="comment-item">
                        <div class="comment-header">
                            <img class="comment-avatar" src="${avatarSrc}" alt="${comment.username}'s avatar">
                            <div class="comment-author-info">
                                <a href="/profile/username/${comment.username}" class="comment-author">${comment.username}</a>
                                <div class="comment-time">${formatDate(comment.createdAt)}</div>
                            </div>
                            ${comment.username === currentUser?.username ?
                    `<button class="delete-comment-btn" data-id="${comment.id}">🗑️</button>` : ''}
                        </div>
                        <div class="comment-content">${comment.content}</div>
                    </div>
                `;
            }).join('');

        // Добавляем обработчики для кнопок удаления
        commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.currentTarget.dataset.id;
                deleteComment(commentId, postId);
            });
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<div class="error">Failed to load comments</div>';
    }
}

async function submitComment(postId) {
    const textarea = document.getElementById(`comment-textarea-${postId}`);
    const content = textarea.value.trim();
    if (!content) return;

    try {
        await fetchWithAuth('/comments/create', {
            method: 'POST',
            body: JSON.stringify({ postId, content })
        });
        textarea.value = '';
        loadComments(postId);
        updateCommentCount(postId);
    } catch (error) {
        console.error('Error submitting comment:', error);
    }
}

async function deleteComment(commentId, postId) {
    try {
        await fetchWithAuth(`/comments/delete/${commentId}`, { method: 'DELETE' });
        loadComments(postId);
        updateCommentCount(postId);
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
}

async function updateCommentCount(postId) {
    try {
        const response = await fetchWithAuth(`/comments/count/${postId}`);
        const count = await response.json();
        document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`).textContent = `(${count})`;
    } catch (error) {
        console.error('Error updating comment count:', error);
    }
}

// Delete Post
async function deletePost() {
    if (!postIdToDelete) return;

    try {
        // 1. Получаем комментарии к посту
        const commentsResponse = await fetchWithAuth(`/comments/post/${postIdToDelete}`);
        const comments = await commentsResponse.json();

        // 2. Удаляем все комментарии
        if (comments.length > 0) {
            await Promise.all(comments.map(comment =>
                fetchWithAuth(`/comments/delete/${comment.id}`, { method: 'DELETE' })
            ));
        }

        // 3. Удаляем медиа (если есть)
        await fetchWithAuth(`/media/delete/${postIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(error => {
            // Игнорируем ошибку, если медиа нет
            console.warn('No media to delete:', error);
        });

        // 4. Удаляем сам пост
        await fetchWithAuth(`/posts/delete/${postIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 5. Обновляем список постов
        await loadPosts();
        alert('Post deleted successfully');
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post: ' + error.message);
    } finally {
        document.getElementById('deleteModal').style.display = 'none';
        postIdToDelete = null;
    }
}

// Trends and Suggested Users
async function loadTrends() {
    const trendsContainer = document.getElementById('trendsContainer');
    try {
        const response = await fetchWithAuth('/trends'); // Предполагаемый endpoint
        const trends = await response.json();
        trendsContainer.innerHTML = trends.map(trend => `
            <div class="trend-item">
                <span class="trend-name">${trend.name}</span>
                <span class="trend-count">${trend.count} posts</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading trends:', error);
        trendsContainer.innerHTML = '<div class="error">Failed to load trends</div>';
    }
}

async function loadSuggestedUsers() {
    const suggestedUsers = document.getElementById('suggestedUsers');
    try {
        const response = await fetchWithAuth('/profiles/suggested');
        const users = await response.json();
        suggestedUsers.innerHTML = users.map(user => `
            <div class="suggested-user">
                <a href="/profile/username/${user.username}">${user.username}</a>
                <button class="follow-btn" data-id="${user.id}">Follow</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading suggested users:', error);
        suggestedUsers.innerHTML = '<div class="error">Failed to load suggestions</div>';
    }
}

// Event Listeners
function addPostEventListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const postId = e.currentTarget.dataset.id;
            const likeCountSpan = e.currentTarget.querySelector('.like-count');
            let count = parseInt(likeCountSpan.textContent);
            e.currentTarget.classList.toggle('liked');
            likeCountSpan.textContent = e.currentTarget.classList.contains('liked') ? count + 1 : count - 1;
        });
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const postId = e.currentTarget.dataset.id;
            const commentsSection = document.getElementById(`comments-section-${postId}`);
            commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
            if (commentsSection.style.display === 'block') loadComments(postId);
        });
    });

    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', e => submitComment(e.currentTarget.dataset.id));
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            postIdToDelete = e.currentTarget.dataset.id;
            document.getElementById('deleteModal').style.display = 'flex';
        });
    });
}

document.getElementById('confirmDelete').addEventListener('click', deletePost);
document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').style.display = 'none';
    postIdToDelete = null;
});

document.getElementById('forYouBtn').addEventListener('click', () => {
    feedType = 'forYou';
    document.getElementById('forYouBtn').classList.add('active');
    document.getElementById('followingBtn').classList.remove('active');
    loadPosts();
});

document.getElementById('followingBtn').addEventListener('click', () => {
    feedType = 'following';
    document.getElementById('followingBtn').classList.add('active');
    document.getElementById('forYouBtn').classList.remove('active');
    loadPosts();
});

// Navigation between sections
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        if (e.target.id === 'logoutBtn') return;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');
        const section = e.target.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${section}Section`).classList.add('active');
    });
});

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getFormattedMediaUrl(mediaUrl) {
    if (!mediaUrl || mediaUrl.startsWith('/media/files/')) return mediaUrl;
    return `/media/files/${mediaUrl.split('/').pop()}`;
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '/login';
        return;
    }
    await getCurrentUser();
    setupPostModal();
    await loadPosts();
    await loadTrends();
    await loadSuggestedUsers();
});