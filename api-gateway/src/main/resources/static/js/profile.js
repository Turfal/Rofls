// Global variables
let currentUserId;
let isOwnProfile = false;
let profileData = null;
let postIdToDelete = null;
let selectedMedia = null;
let mediaType = null;
let currentUsername = null;

// Get user ID or username from URL path
function getUserIdFromPath() {
    const path = window.location.pathname;
    const pathParts = path.split('/');
    if (path.includes('/profile/username/') && pathParts.length > 3) {
        return { type: 'username', value: pathParts[pathParts.length - 1] };
    } else if (path.includes('/profile/') && pathParts.length > 2) {
        return { type: 'userId', value: pathParts[pathParts.length - 1] };
    }
    return null;
}

// Format date functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Check authentication
const token = localStorage.getItem('jwt_token');
if (!token) {
    console.log('No token found, redirecting to login');
    window.location.href = '/login';
}

// Fetch wrapper with token
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        if (!response.ok) {
            console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('jwt_token');
                window.location.href = '/login';
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error(`Network error for ${url}:`, error);
        throw error;
    }
}

// Get current user
async function getCurrentUser() {
    try {
        const response = await fetchWithAuth('/auth/me');
        const userData = await response.json();
        console.log('Current user data:', userData);
        currentUsername = userData.username;
        document.getElementById('username').textContent = userData.username;
        return userData;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

// Load profile data
async function loadProfile(identifier) {
    try {
        let url;
        if (identifier.type === 'username') {
            url = `/profiles/username/${identifier.value}`;
        } else {
            url = `/profiles/${identifier.value}`;
        }
        const response = await fetchWithAuth(url);
        profileData = await response.json();
        console.log('Profile data:', profileData);
        displayProfile(profileData);
    } catch (error) {
        console.error('Error loading profile:', error);
        document.querySelector('.profile-container').innerHTML = '<p class="error-message">Error loading profile</p>';
    }
}

// Display profile data
function displayProfile(profile) {
    document.getElementById('profileUsername').textContent = profile.username || 'Неизвестная нода';
    document.getElementById('profileBio').textContent = profile.bio || 'Ядро не определено';
    document.getElementById('postsCount').textContent = profile.postsCount || 0;
    document.getElementById('commentsCount').textContent = profile.commentsCount || 0;
    document.getElementById('ratingValue').textContent = profile.rating || 0;
    document.getElementById('joinDate').textContent = formatDate(profile.joinDate);
    document.getElementById('lastActive').textContent = formatDateTime(profile.lastActive);
    document.getElementById('totalUpvotes').textContent = profile.totalUpvotes || 0;
    document.getElementById('totalDownvotes').textContent = profile.totalDownvotes || 0;
    document.getElementById('achievementsCount').textContent = profile.achievementsCount || 0;

    if (profile.avatarUrl) {
        document.getElementById('profileAvatar').src = profile.avatarUrl;
    } else {
        document.getElementById('profileAvatar').src = '/media/files/raw.png';
    }

    if (isOwnProfile) {
        const editBtnContainer = document.getElementById('editProfileBtnContainer');
        editBtnContainer.innerHTML = '<button id="editProfileBtn" class="edit-node"><i class="fas fa-cog"></i> Настройка</button>';
        document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    }

    const postsTitle = document.getElementById('postsTitle');
    if (postsTitle) {
        postsTitle.textContent = isOwnProfile ? 'Ваши импульсы' : `Импульсы ${profile.username}`;
    }
}

// Load user's posts
let isLoadingPosts = false;

async function loadRecentPosts() {
    if (isLoadingPosts) return;
    isLoadingPosts = true;

    const postsContainer = document.getElementById('recentPostsContainer');
    if (!postsContainer) {
        console.error('recentPostsContainer not found');
        isLoadingPosts = false;
        return;
    }

    postsContainer.innerHTML = '';

    try {
        const response = await fetchWithAuth(`/posts/user/${profileData.username}`);
        const posts = await response.json();
        const commentCountPromises = posts.map(post =>
            fetchWithAuth(`/comments/count/${post.id}`)
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

        const postsWithCommentCounts = await Promise.all(commentCountPromises);

        postsWithCommentCounts.forEach(post => {
            const postElement = createRecentPostElement(post);
            postsContainer.appendChild(postElement);
        });

        addPostEventListeners();

        const createPostBtnContainer = document.getElementById('createPostBtnContainer');
        if (createPostBtnContainer) {
            if (isOwnProfile) {
                createPostBtnContainer.innerHTML = '<button id="createPostBtn" class="create-node"><i class="fas fa-plus"></i> Эмиссия</button>';
                document.getElementById('createPostBtn').addEventListener('click', () => {
                    document.getElementById('postModal').style.display = 'flex';
                    document.getElementById('postText').focus();
                });
            } else {
                createPostBtnContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error">Ошибка сканирования импульсов</div>';
    } finally {
        isLoadingPosts = false;
    }
}

// Create recent post element with clickable username
function createRecentPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    postDiv.setAttribute('data-post-id', post.id);

    let mediaContent = '';
    const formattedMediaUrl = getFormattedMediaUrl(post.mediaUrl);
    if (formattedMediaUrl) {
        if (post.mediaType === 'image') {
            mediaContent = `<img class="post-media" src="${formattedMediaUrl}" alt="Post image">`;
        } else if (post.mediaType === 'video') {
            mediaContent = `
                <video class="post-media" controls>
                    <source src="${formattedMediaUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`;
        }
    }

    const avatarSrc = profileData.avatarUrl || '/media/files/raw.png';

    postDiv.innerHTML = `
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
            <div class="post-actions">
                <button class="like-btn" data-id="${post.id}">
                    <span class="like-icon">❤️</span>
                    <span class="like-count">${post.likes || 0}</span>
                </button>
                <button class="comment-btn" data-id="${post.id}">
                    <span class="comment-icon">💬</span> Comments <span class="comment-count">(${post.commentCount || 0})</span>
                </button>
                ${post.username === currentUsername
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
    return postDiv;
}

// Post Modal functionality
function setupPostModal() {
    const postModal = document.getElementById('postModal');
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

    if (!postModal) console.error('postModal not found');
    if (!cancelPostBtn) console.error('cancelPostBtn not found');
    if (!postTextArea) console.error('postTextArea not found');
    if (!charCount) console.error('charCount not found');
    if (!postMediaUpload) console.error('postMediaUpload not found');
    if (!attachMediaBtn) console.error('attachMediaBtn not found');
    if (!mediaPreview) console.error('mediaPreview not found');
    if (!previewContainer) console.error('previewContainer not found');
    if (!removeMediaBtn) console.error('removeMediaBtn not found');
    if (!submitPostBtn) console.error('submitPostBtn not found');

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
            await loadRecentPosts();
            await loadProfile({ type: 'userId', value: currentUserId });
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    });
}

function resetPostForm() {
    const postTextArea = document.getElementById('postText');
    const charCount = document.getElementById('charCount');
    const postMediaUpload = document.getElementById('postMediaUpload');
    const mediaPreview = document.getElementById('mediaPreview');
    const previewContainer = document.getElementById('previewContainer');

    postTextArea.value = '';
    charCount.textContent = '0';
    charCount.style.color = '#888';
    selectedMedia = null;
    mediaType = null;
    postMediaUpload.value = '';
    mediaPreview.style.display = 'none';
    previewContainer.innerHTML = '';
}

function getFormattedMediaUrl(mediaUrl) {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith('/media/files/')) return mediaUrl;
    const parts = mediaUrl.split('/');
    const filename = parts[parts.length - 1];
    return `/media/files/${filename}`;
}

// Comments
async function loadComments(postId) {
    try {
        const response = await fetchWithAuth(`/comments/post/${postId}`);
        const comments = await response.json();
        const commentsList = document.getElementById(`comments-list-${postId}`);
        commentsList.innerHTML = '';

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
            return;
        }

        const initialComments = comments.slice(0, 5);
        const remainingComments = comments.slice(5);

        // Создаем элементы для первых 5 комментариев
        initialComments.forEach(comment => {
            const commentElement = createCommentElement(comment, postId);
            commentsList.appendChild(commentElement);
        });

        // Добавляем кнопку "Show more", если есть ещё комментарии
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

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.closest('button').getAttribute('data-id');
                showDeleteCommentModal(commentId, postId);
            });
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById(`comments-list-${postId}`).innerHTML = '<p>Error loading comments.</p>';
    }
}
// Create comment element with clickable username
function createCommentElement(comment, postId) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment-item');

    // Определяем аватарку: используем profileData для владельца профиля, иначе дефолт
    const avatarSrc = (comment.username === profileData.username && profileData.avatarUrl)
        ? profileData.avatarUrl
        : '/media/files/raw.png';

    commentElement.innerHTML = `
        <div class="comment-header">
            <img class="comment-avatar" src="${avatarSrc}" alt="${comment.username}'s avatar">
            <div class="comment-author-info">
                <a href="/profile/username/${comment.username}" class="comment-author">${comment.username || 'Unknown'}</a>
                <div class="comment-time">${formatDate(comment.createdAt)}</div>
            </div>
            ${comment.username === currentUsername
        ? `<button class="delete-comment-btn" data-id="${comment.id}">
                    <span class="delete-icon">🗑️</span>
                </button>`
        : ''}
        </div>
        <div class="comment-content">${comment.content || ''}</div>
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

async function deleteComment(commentId, postId) {
    try {
        await fetchWithAuth(`/comments/delete/${commentId}`, { method: 'DELETE' });
        await loadComments(postId);
        await updateCommentCount(postId);
        await loadProfile({ type: 'userId', value: currentUserId });
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
    }
}

async function submitComment(postId) {
    const commentText = document.getElementById(`comment-textarea-${postId}`).value.trim();
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    try {
        await fetchWithAuth('/comments/create', {
            method: 'POST',
            body: JSON.stringify({ postId, content: commentText })
        });
        document.getElementById(`comment-textarea-${postId}`).value = '';
        await loadComments(postId);
        await updateCommentCount(postId);
        await loadProfile({ type: 'userId', value: currentUserId });
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

async function updateCommentCount(postId) {
    try {
        const response = await fetchWithAuth(`/comments/count/${postId}`);
        const count = await response.json();
        const commentBtns = document.querySelectorAll(`.comment-btn[data-id="${postId}"] .comment-count`);
        commentBtns.forEach(btn => {
            btn.textContent = `(${count})`;
        });
    } catch (error) {
        console.error('Error updating comment count:', error);
    }
}

// Event listeners for posts
function addPostEventListeners() {
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            const likeCountSpan = e.currentTarget.querySelector('.like-count');
            let likeCount = parseInt(likeCountSpan.textContent);
            if (e.currentTarget.classList.contains('liked')) {
                e.currentTarget.classList.remove('liked');
                likeCountSpan.textContent = likeCount - 1;
            } else {
                e.currentTarget.classList.add('liked');
                likeCountSpan.textContent = likeCount + 1;
            }
        });
    });

    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            const commentsSection = document.getElementById(`comments-section-${postId}`);
            if (commentsSection.style.display === 'none') {
                commentsSection.style.display = 'block';
                loadComments(postId);
            } else {
                commentsSection.style.display = 'none';
            }
        });
    });

    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            submitComment(postId);
        });
    });

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            postIdToDelete = postId;
            document.getElementById('deleteModal').style.display = 'flex';
        });
    });
}

// Delete post
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
        await fetchWithAuth(`/media/delete/${postIdToDelete}`, { method: 'DELETE' })
            .catch(error => {
                console.warn('No media to delete or error deleting media:', error);
                // Игнорируем ошибку, если медиа нет
            });

        // 4. Удаляем сам пост
        await fetchWithAuth(`/posts/delete/${postIdToDelete}`, { method: 'DELETE' });

        // 5. Обновляем страницу
        await loadRecentPosts();
        await loadProfile({ type: 'userId', value: currentUserId });
        alert('Post and associated comments deleted successfully');
    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.message}`);
    } finally {
        document.getElementById('deleteModal').style.display = 'none';
        postIdToDelete = null;
    }
}

// Edit profile modal functions
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    const bioInput = document.getElementById('bioInput');
    const avatarUrlInput = document.getElementById('avatarUrlInput');
    const avatarPreview = document.getElementById('avatarPreview');

    bioInput.value = profileData.bio || '';
    avatarUrlInput.value = profileData.avatarUrl || '';
    avatarPreview.src = profileData.avatarUrl || '/media/files/raw.png';
    document.getElementById('bioCharCount').textContent = bioInput.value.length;
    modal.style.display = 'block';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function updateProfile() {
    const bioInput = document.getElementById('bioInput');
    const avatarUrlInput = document.getElementById('avatarUrlInput');

    try {
        await fetchWithAuth(`/profiles/${currentUserId}`, {
            method: 'PUT',
            body: JSON.stringify({
                bio: bioInput.value,
                avatarUrl: avatarUrlInput.value
            })
        });

        await loadProfile({ type: 'userId', value: currentUserId });
        closeEditProfileModal();
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login?logout=true';
    });

    const bioInput = document.getElementById('bioInput');
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            document.getElementById('bioCharCount').textContent = bioInput.value.length;
        });
    }

    const avatarUrlInput = document.getElementById('avatarUrlInput');
    if (avatarUrlInput) {
        avatarUrlInput.addEventListener('input', () => {
            document.getElementById('avatarPreview').src = avatarUrlInput.value || '/media/files/raw.png';
        });
    }

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditProfileModal);
    }

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', updateProfile);
    }

    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deletePost);
    }

    const cancelDeleteBtn = document.getElementById('cancelDelete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
            postIdToDelete = null;
        });
    }

    setupPostModal();
}

// Initialize
async function init() {
    const urlIdentifier = getUserIdFromPath();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        console.log('No current user data, redirecting to login');
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        return;
    }

    currentUserId = currentUser.id;
    currentUsername = currentUser.username;

    let profileIdentifier = urlIdentifier || { type: 'userId', value: currentUser.id };
    isOwnProfile = !urlIdentifier ||
        (profileIdentifier.type === 'userId' && profileIdentifier.value === currentUser.id) ||
        (profileIdentifier.type === 'username' && profileIdentifier.value === currentUser.username);

    console.log('Loading profile for identifier:', profileIdentifier);
    await loadProfile(profileIdentifier);
    await loadRecentPosts();
    setupEventListeners();
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('jwt_token')) {
        console.log('No token on DOM load, redirecting to login');
        window.location.href = '/login';
        return;
    }
    init();
});