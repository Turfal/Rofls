// Global variables
let currentUserId;
let isOwnProfile = false;
let profileData = null;
let postIdToRepost = null;
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
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userData.username;
        }
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
        updateProfileStats();
    } catch (error) {
        console.error('Error loading profile:', error);
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.innerHTML = '<p class="error-message">Error loading profile</p>';
        }
    }
}

// Display profile data
function displayProfile(profile) {
    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) {
        profileUsername.textContent = profile.username || 'Unknown User';
    } else {
        console.error('profileUsername element not found');
    }

    const profileBio = document.getElementById('profileBio');
    if (profileBio) {
        profileBio.textContent = profile.bio || 'No bio available';
    } else {
        console.error('profileBio element not found');
    }

    // Статистика
    const postsCount = document.getElementById('postsCount');
    if (postsCount) {
        postsCount.textContent = profile.postsCount !== undefined ? profile.postsCount : 0;
    }
    const commentsCount = document.getElementById('commentsCount');
    if (commentsCount) {
        commentsCount.textContent = profile.commentsCount !== undefined ? profile.commentsCount : 0;
    }
    const ratingValue = document.getElementById('ratingValue');
    if (ratingValue) {
        ratingValue.textContent = profile.rating !== undefined ? profile.rating : 0;
    }
    const followersCount = document.getElementById('followersCount');
    if (followersCount) {
        followersCount.textContent = profile.followersCount !== undefined ? profile.followersCount : 0;
    }
    const followingCount = document.getElementById('followingCount');
    if (followingCount) {
        followingCount.textContent = profile.followingCount !== undefined ? profile.followingCount : 0;
    }
    const friendsCount = document.getElementById('friendsCount');
    if (friendsCount) {
        friendsCount.textContent = profile.friendsCount !== undefined ? profile.friendsCount : 0;
    }

    // Дополнительная информация
    const joinDate = document.getElementById('joinDate');
    if (joinDate) {
        joinDate.textContent = formatDate(profile.joinDate) || 'Unknown';
    }
    const lastActive = document.getElementById('lastActive');
    if (lastActive) {
        lastActive.textContent = formatDateTime(profile.lastActive) || 'Unknown';
    }
    const totalUpvotes = document.getElementById('totalUpvotes');
    if (totalUpvotes) {
        totalUpvotes.textContent = profile.totalUpvotes !== undefined ? profile.totalUpvotes : 0;
    }
    const totalDownvotes = document.getElementById('totalDownvotes');
    if (totalDownvotes) {
        totalDownvotes.textContent = profile.totalDownvotes !== undefined ? profile.totalDownvotes : 0;
    }
    const achievementsCount = document.getElementById('achievementsCount');
    if (achievementsCount) {
        achievementsCount.textContent = profile.achievementsCount !== undefined ? profile.achievementsCount : 0;
    }

    // Аватар пользователя
    const avatarElement = document.getElementById('profileAvatar');
    if (avatarElement) {
        if (profile.avatarUrl) {
            avatarElement.src = profile.avatarUrl;
        } else {
            avatarElement.src = '/media/files/raw.png';
        }
        avatarElement.onerror = function() {
            this.src = '/media/files/raw.png';
        };
    }

    // Кнопка редактирования профиля или действия (Follow/Friend)
    if (isOwnProfile) {
        const editBtnContainer = document.getElementById('editProfileBtnContainer');
        if (editBtnContainer) {
            editBtnContainer.innerHTML = '<button id="editProfileBtn" class="btn btn-primary"><i class="fas fa-cog"></i> Edit Profile</button>';
            const editProfileBtn = document.getElementById('editProfileBtn');
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', openEditProfileModal);
            }
        }
    } else {
        const editBtnContainer = document.getElementById('editProfileBtnContainer');
        if (editBtnContainer) {
            checkFollowStatus(profile.username).then(isFollowing => {
                const followBtnClass = isFollowing ? 'btn-secondary' : 'btn-primary';
                const followBtnText = isFollowing ? 'Unfollow' : 'Follow';
                const followBtnAction = isFollowing ? `unfollowUser('${profile.username}')` : `followUser('${profile.username}')`;

                editBtnContainer.innerHTML = `
                    <div class="profile-actions">
                        <button id="followBtn" class="btn ${followBtnClass}" onclick="${followBtnAction}">
                            <i class="fas fa-user-plus"></i> ${followBtnText}
                        </button>
                        <button id="friendBtn" class="btn btn-tertiary" onclick="sendFriendRequest('${profile.username}')">
                            <i class="fas fa-user-friends"></i> Add Friend
                        </button>
                    </div>
                `;

                checkFriendStatus(profile.username).then(isFriend => {
                    const friendBtn = document.getElementById('friendBtn');
                    if (friendBtn && isFriend) {
                        friendBtn.textContent = 'Friends';
                        friendBtn.disabled = true;
                        friendBtn.classList.add('btn-success');
                    }
                });
            });
        }
    }

    // Обновляем заголовок раздела постов
    const postsTitle = document.getElementById('postsTitle');
    if (postsTitle) {
        postsTitle.textContent = isOwnProfile ? 'Your Posts' : `${profile.username}'s Posts`;
    }
}

// Update profile statistics
async function updateProfileStats() {
    try {
        const identifier = getUserIdFromPath() || { type: 'userId', value: currentUserId };
        const response = await fetchWithAuth(`/profiles/stats/${identifier.value}`);
        const stats = await response.json();

        const postsCount = document.getElementById('postsCount');
        if (postsCount) {
            postsCount.textContent = stats.postsCount !== undefined ? stats.postsCount : 0;
        }
        const commentsCount = document.getElementById('commentsCount');
        if (commentsCount) {
            commentsCount.textContent = stats.commentsCount !== undefined ? stats.commentsCount : 0;
        }
        const ratingValue = document.getElementById('ratingValue');
        if (ratingValue) {
            ratingValue.textContent = stats.rating !== undefined ? stats.rating : 0;
        }
        const followersCount = document.getElementById('followersCount');
        if (followersCount) {
            followersCount.textContent = stats.followersCount !== undefined ? stats.followersCount : 0;
        }
        const followingCount = document.getElementById('followingCount');
        if (followingCount) {
            followingCount.textContent = stats.followingCount !== undefined ? stats.followingCount : 0;
        }
        const friendsCount = document.getElementById('friendsCount');
        if (friendsCount) {
            friendsCount.textContent = stats.friendsCount !== undefined ? stats.friendsCount : 0;
        }
        const totalUpvotes = document.getElementById('totalUpvotes');
        if (totalUpvotes) {
            totalUpvotes.textContent = stats.totalUpvotes !== undefined ? stats.totalUpvotes : 0;
        }
        const totalDownvotes = document.getElementById('totalDownvotes');
        if (totalDownvotes) {
            totalDownvotes.textContent = stats.totalDownvotes !== undefined ? stats.totalDownvotes : 0;
        }
    } catch (error) {
        console.error('Error updating profile stats:', error);
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

        postsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением постов

        if (postsWithCommentCounts.length === 0) {
            postsContainer.innerHTML = '<div class="no-posts">No posts yet.</div>';
        } else {
            postsWithCommentCounts.forEach(post => {
                const postElement = createRecentPostElement(post);
                postsContainer.appendChild(postElement);
            });
        }

        addPostEventListeners();

        const createPostBtnContainer = document.getElementById('createPostBtnContainer');
        if (createPostBtnContainer) {
            if (isOwnProfile) {
                createPostBtnContainer.innerHTML = `
                    <button id="createPostBtn" class="btn btn-primary create-post-btn">
                        <i class="fas fa-pen"></i> <span data-lang="create_post">Create Post</span>
                    </button>
                `;
                const createPostBtn = document.getElementById('createPostBtn');
                if (createPostBtn) {
                    createPostBtn.addEventListener('click', () => {
                        const postModal = document.getElementById('postModal');
                        if (postModal) {
                            postModal.style.display = 'flex';
                            const postText = document.getElementById('postText');
                            if (postText) {
                                postText.focus();
                            }
                        }
                    });
                }
            } else {
                createPostBtnContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error">Error loading posts</div>';
    } finally {
        isLoadingPosts = false;
    }
}

// Create recent post element
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
                    <span class="comment-icon">💬</span> <span data-lang="comments">Comments</span> <span class="comment-count">(${post.commentCount || 0})</span>
                </button>
                <button class="repost-btn" data-id="${post.id}">
                    <span class="repost-icon">🔄</span> <span data-lang="repost">Repost</span>
                </button>
                ${post.username === currentUsername
        ? `<button class="delete-post-btn" data-id="${post.id}">
                        <span class="delete-icon">🗑️</span> <span data-lang="delete">Delete</span>
                    </button>`
        : ''}
            </div>
        </div>
        <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post.id}"></div>
            <div class="add-comment">
                <textarea class="comment-textarea" id="comment-textarea-${post.id}" placeholder="Write a comment..."></textarea>
                <button class="submit-comment-btn" data-id="${post.id}" data-lang="comment">Comment</button>
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

    if (!postModal || !cancelPostBtn || !postTextArea || !charCount || !postMediaUpload || !attachMediaBtn || !mediaPreview || !previewContainer || !removeMediaBtn || !submitPostBtn) {
        console.error('Post modal elements missing');
        return;
    }

    cancelPostBtn.addEventListener('click', () => {
        postModal.style.display = 'none';
        resetPostForm();
    });

    postTextArea.addEventListener('input', () => {
        const length = postTextArea.value.length;
        charCount.textContent = length;
        charCount.style.color = length > 220 ? '#ff4d4d' : '#888';
    });

    attachMediaBtn.addEventListener('click', () => {
        postMediaUpload.click();
    });

    postMediaUpload.addEventListener('change', () => {
        const file = postMediaUpload.files[0];
        if (file) {
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
            mediaPreview.style.display = 'block';
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
                const response = await fetch('/media/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                if (!response.ok) {
                    throw new Error('Failed to upload media');
                }
                const mediaData = await response.json();
                mediaUrl = mediaData.imageUrl;
            }

            const postData = {
                content: postText,
                mediaUrl: mediaUrl,
                mediaType: mediaType
            };

            const postResponse = await fetch('/posts/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            });
            if (!postResponse.ok) {
                throw new Error('Failed to create post');
            }
            postModal.style.display = 'none';
            resetPostForm();
            await loadRecentPosts();
            await updateProfileStats();
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

    if (postTextArea) postTextArea.value = '';
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#888';
    }
    selectedMedia = null;
    mediaType = null;
    if (postMediaUpload) postMediaUpload.value = '';
    if (mediaPreview) mediaPreview.style.display = 'none';
    if (previewContainer) previewContainer.innerHTML = '';
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
        if (!commentsList) return;

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
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (commentsList) {
            commentsList.innerHTML = '<p>Error loading comments.</p>';
        }
    }
}

function createCommentElement(comment, postId) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment-item');

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
        await updateProfileStats();
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
    }
}

async function submitComment(postId) {
    const commentTextArea = document.getElementById(`comment-textarea-${postId}`);
    if (!commentTextArea) return;

    const commentText = commentTextArea.value.trim();
    if (!commentText) {
        alert('Please enter a comment');
        return;
    }

    try {
        await fetchWithAuth('/comments/create', {
            method: 'POST',
            body: JSON.stringify({ postId, content: commentText })
        });
        commentTextArea.value = '';
        await loadComments(postId);
        await updateCommentCount(postId);
        await updateProfileStats();
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
            if (commentsSection) {
                if (commentsSection.style.display === 'none') {
                    commentsSection.style.display = 'block';
                    loadComments(postId);
                } else {
                    commentsSection.style.display = 'none';
                }
            }
        });
    });

    document.querySelectorAll('.repost-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const postId = e.currentTarget.getAttribute('data-id');
            showRepostModal(postId);
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
            const deleteModal = document.getElementById('deleteModal');
            if (deleteModal) {
                deleteModal.style.display = 'flex';
            }
        });
    });
}

// Show repost modal
function showRepostModal(postId) {
    let repostModal = document.getElementById('repostModal');

    if (!repostModal) {
        const modalHTML = `
            <div id="repostModal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h4 class="modal-title" data-lang="repost_options">Share Post</h4>
                        <span id="closeRepostModal" class="modal-close">×</span>
                    </div>
                    <div class="repost-options">
                        <button id="repostToFeed" class="btn btn-tertiary repost-option">
                            <i class="fas fa-stream"></i> <span data-lang="repost_to_feed">Repost to feed</span>
                        </button>
                        <button id="repostToChat" class="btn btn-tertiary repost-option">
                            <i class="fas fa-comments"></i> <span data-lang="share_in_conversation">Share in conversation</span>
                        </button>
                    </div>
                    <div id="chatSelectContainer" style="display: none; margin-top: var(--space-md);">
                        <select id="conversationSelect" class="form-control">
                            <option value="">Select a conversation...</option>
                        </select>
                        <button id="confirmRepostToChat" class="btn btn-primary mt-sm" data-lang="share">Share</button>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // Обработчики событий
        const closeRepostModal = document.getElementById('closeRepostModal');
        if (closeRepostModal) {
            closeRepostModal.addEventListener('click', () => {
                repostModal = document.getElementById('repostModal');
                if (repostModal) {
                    repostModal.style.display = 'none';
                }
            });
        }

        const repostToFeedBtn = document.getElementById('repostToFeed');
        if (repostToFeedBtn) {
            repostToFeedBtn.addEventListener('click', () => {
                repostToFeed(postIdToRepost);
            });
        }

        const repostToChatBtn = document.getElementById('repostToChat');
        if (repostToChatBtn) {
            repostToChatBtn.addEventListener('click', async () => {
                const chatSelectContainer = document.getElementById('chatSelectContainer');
                if (chatSelectContainer) {
                    chatSelectContainer.style.display = 'block';
                }

                try {
                    const response = await fetchWithAuth('/conversations/list');
                    const conversations = await response.json();

                    const select = document.getElementById('conversationSelect');
                    if (select) {
                        select.innerHTML = '<option value="">Select a conversation...</option>';

                        conversations.forEach(conv => {
                            const option = document.createElement('option');
                            option.value = conv.id;
                            option.textContent = conv.title;
                            select.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Error loading conversations:', error);
                    alert('Failed to load conversations');
                }
            });
        }

        const confirmRepostToChatBtn = document.getElementById('confirmRepostToChat');
        if (confirmRepostToChatBtn) {
            confirmRepostToChatBtn.addEventListener('click', () => {
                const conversationId = document.getElementById('conversationSelect')?.value;
                if (conversationId) {
                    repostToChat(postIdToRepost, conversationId);
                } else {
                    alert('Please select a conversation');
                }
            });
        }

        // Закрытие при клике вне модального окна
        repostModal = document.getElementById('repostModal');
        if (repostModal) {
            repostModal.addEventListener('click', (event) => {
                if (event.target === repostModal) {
                    repostModal.style.display = 'none';
                }
            });
        }
    }

    postIdToRepost = postId;
    repostModal = document.getElementById('repostModal');
    if (repostModal) {
        repostModal.style.display = 'flex';
        const chatSelectContainer = document.getElementById('chatSelectContainer');
        if (chatSelectContainer) {
            chatSelectContainer.style.display = 'none';
        }
    }
}

// Handle repost to feed
async function repostToFeed(postId) {
    try {
        const response = await fetchWithAuth(`/posts/${postId}`);
        const post = await response.json();

        const repostContent = `Reposted from @${post.username}: ${post.content}`;
        const repostData = {
            content: repostContent,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType
        };

        await fetchWithAuth('/posts/create', {
            method: 'POST',
            body: JSON.stringify(repostData)
        });

        const repostModal = document.getElementById('repostModal');
        if (repostModal) {
            repostModal.style.display = 'none';
        }
        await loadRecentPosts();
        alert('Post reposted successfully!');
    } catch (error) {
        console.error('Error reposting to feed:', error);
        alert('Failed to repost. Please try again.');
    }
}

// Handle repost to chat
async function repostToChat(postId, conversationId) {
    try {
        const repostData = {
            postId: postId,
            conversationId: conversationId
        };

        await fetchWithAuth('/repost/toConversation', {
            method: 'POST',
            body: JSON.stringify(repostData)
        });

        const repostModal = document.getElementById('repostModal');
        if (repostModal) {
            repostModal.style.display = 'none';
        }
        alert('Post shared in conversation successfully!');
    } catch (error) {
        console.error('Error sharing to conversation:', error);
        alert('Failed to share. Please try again.');
    }
}

// Delete post
async function deletePost() {
    if (!postIdToDelete) return;

    try {
        const commentsResponse = await fetchWithAuth(`/comments/post/${postIdToDelete}`);
        const comments = await commentsResponse.json();

        if (comments.length > 0) {
            await Promise.all(comments.map(comment =>
                fetchWithAuth(`/comments/delete/${comment.id}`, { method: 'DELETE' })
            ));
        }

        await fetchWithAuth(`/media/delete/${postIdToDelete}`, { method: 'DELETE' })
            .catch(error => {
                console.warn('No media to delete or error deleting media:', error);
            });

        await fetchWithAuth(`/posts/delete/${postIdToDelete}`, { method: 'DELETE' });

        await loadRecentPosts();
        await updateProfileStats();
        alert('Post and associated comments deleted successfully');
    } catch (error) {
        console.error('Error deleting post:', error);
        alert(`Failed to delete post: ${error.message}`);
    } finally {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
        postIdToDelete = null;
    }
}

// Edit profile modal functions
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    const bioInput = document.getElementById('bioInput');
    const avatarUrlInput = document.getElementById('avatarUrlInput');
    const avatarPreview = document.getElementById('avatarPreview');

    if (modal && bioInput && avatarUrlInput && avatarPreview) {
        bioInput.value = profileData.bio || '';
        avatarUrlInput.value = profileData.avatarUrl || '';
        avatarPreview.src = profileData.avatarUrl || '/media/files/raw.png';
        const bioCharCount = document.getElementById('bioCharCount');
        if (bioCharCount) {
            bioCharCount.textContent = bioInput.value.length;
        }
        modal.style.display = 'block';
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function updateProfile() {
    const bioInput = document.getElementById('bioInput');
    const avatarUrlInput = document.getElementById('avatarUrlInput');

    if (!bioInput || !avatarUrlInput) return;

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

// Relationships modal
function showRelationshipsModal(type = 'followers') {
    const modal = document.getElementById('relationshipsModal');
    const title = document.getElementById('relationshipsModalTitle');
    const followersTab = document.getElementById('followersTab');
    const followingTab = document.getElementById('followingTab');
    const friendsTab = document.getElementById('friendsTab');
    const followersContent = document.getElementById('followersContent');
    const followingContent = document.getElementById('followingContent');
    const friendsContent = document.getElementById('friendsContent');
    const friendRequestsSection = document.getElementById('friendRequestsSection');

    if (!modal || !title || !followersTab || !followingTab || !friendsTab || !followersContent || !followingContent || !friendsContent || !friendRequestsSection) {
        console.error('Relationships modal elements missing');
        return;
    }

    if (type === 'followers') {
        title.textContent = 'Followers';
        followersTab.classList.add('active');
        followingTab.classList.remove('active');
        friendsTab.classList.remove('active');
        followersContent.style.display = 'block';
        followingContent.style.display = 'none';
        friendsContent.style.display = 'none';
        friendRequestsSection.style.display = isOwnProfile ? 'block' : 'none';
        loadFollowers();
    } else if (type === 'following') {
        title.textContent = 'Following';
        followersTab.classList.remove('active');
        followingTab.classList.add('active');
        friendsTab.classList.remove('active');
        followersContent.style.display = 'none';
        followingContent.style.display = 'block';
        friendsContent.style.display = 'none';
        friendRequestsSection.style.display = isOwnProfile ? 'block' : 'none';
        loadFollowing();
    } else if (type === 'friends') {
        title.textContent = 'Friends';
        followersTab.classList.remove('active');
        followingTab.classList.remove('active');
        friendsTab.classList.add('active');
        followersContent.style.display = 'none';
        followingContent.style.display = 'none';
        friendsContent.style.display = 'block';
        friendRequestsSection.style.display = isOwnProfile ? 'block' : 'none';
        loadFriends();
    }

    if (isOwnProfile) {
        loadPendingFriendRequests();
    }

    modal.style.display = 'flex';
}

async function loadFollowers() {
    const followersContent = document.getElementById('followersContent');
    if (!followersContent) return;

    followersContent.innerHTML = '<p>Loading...</p>';

    try {
        const followers = await getFollowers();
        followersContent.innerHTML = '';
        if (followers.length === 0) {
            followersContent.innerHTML = '<p>No followers yet.</p>';
            return;
        }

        followers.forEach(user => {
            const userElement = createUserElement(user);
            followersContent.appendChild(userElement);
        });
    } catch (error) {
        followersContent.innerHTML = '<p>Error loading followers.</p>';
    }
}

async function loadFollowing() {
    const followingContent = document.getElementById('followingContent');
    if (!followingContent) return;

    followingContent.innerHTML = '<p>Loading...</p>';

    try {
        const following = await getFollowing();
        followingContent.innerHTML = '';
        if (following.length === 0) {
            followingContent.innerHTML = '<p>Not following anyone yet.</p>';
            return;
        }

        following.forEach(user => {
            const userElement = createUserElement(user);
            followingContent.appendChild(userElement);
        });
    } catch (error) {
        followingContent.innerHTML = '<p>Error loading following.</p>';
    }
}

async function loadFriends() {
    const friendsContent = document.getElementById('friendsContent');
    if (!friendsContent) return;

    friendsContent.innerHTML = '<p>Loading...</p>';

    try {
        const friends = await getFriends();
        friendsContent.innerHTML = '';
        if (friends.length === 0) {
            friendsContent.innerHTML = '<p>No friends yet.</p>';
            return;
        }

        friends.forEach(user => {
            const userElement = createUserElement(user);
            friendsContent.appendChild(userElement);
        });
    } catch (error) {
        friendsContent.innerHTML = '<p>Error loading friends.</p>';
    }
}

async function loadPendingFriendRequests() {
    const friendRequestsList = document.getElementById('friendRequestsList');
    if (!friendRequestsList) return;

    friendRequestsList.innerHTML = '<p>Loading...</p>';

    try {
        const requests = await getPendingFriendRequests();
        friendRequestsList.innerHTML = '';
        if (requests.length === 0) {
            friendRequestsList.innerHTML = '<p>No pending friend requests.</p>';
            return;
        }

        requests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = 'friend-request-item';
            requestElement.innerHTML = `
                <div class="friend-request-info">
                    <img src="${request.avatarUrl || '/media/files/raw.png'}" alt="${request.username}'s avatar" class="friend-request-avatar">
                    <a href="/profile/username/${request.username}" class="friend-request-username">${request.username}</a>
                </div>
                <div class="friend-request-actions">
                    <button class="accept-request-btn" data-id="${request.id}"><i class="fas fa-check"></i> Accept</button>
                    <button class="reject-request-btn" data-id="${request.id}"><i class="fas fa-times"></i> Reject</button>
                </div>
            `;
            friendRequestsList.appendChild(requestElement);
        });

        document.querySelectorAll('.accept-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const requestId = e.target.closest('button').getAttribute('data-id');
                if (await acceptFriendRequest(requestId)) {
                    loadPendingFriendRequests();
                    loadFriends();
                    updateProfileStats();
                }
            });
        });

        document.querySelectorAll('.reject-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const requestId = e.target.closest('button').getAttribute('data-id');
                if (await rejectFriendRequest(requestId)) {
                    loadPendingFriendRequests();
                    updateProfileStats();
                }
            });
        });
    } catch (error) {
        friendRequestsList.innerHTML = '<p>Error loading friend requests.</p>';
    }
}

function createUserElement(user) {
    const userElement = document.createElement('div');
    userElement.className = 'relationship-item';
    userElement.innerHTML = `
        <img src="${user.avatarUrl || '/media/files/raw.png'}" alt="${user.username}'s avatar" class="relationship-avatar">
        <a href="/profile/username/${user.username}" class="relationship-username">${user.username}</a>
    `;
    return userElement;
}

// Follow and friend functions
async function followUser(username) {
    try {
        const response = await fetchWithAuth(`/follows/${username}`, {
            method: 'POST'
        });

        if (response.ok) {
            const followBtn = document.getElementById('followBtn');
            if (followBtn) {
                followBtn.textContent = 'Unfollow';
                followBtn.classList.remove('btn-primary');
                followBtn.classList.add('btn-secondary');
                followBtn.onclick = () => unfollowUser(username);
            }
            await updateProfileStats();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error following user:', error);
        return false;
    }
}

async function unfollowUser(username) {
    try {
        const response = await fetchWithAuth(`/follows/${username}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const followBtn = document.getElementById('followBtn');
            if (followBtn) {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('btn-secondary');
                followBtn.classList.add('btn-primary');
                followBtn.onclick = () => followUser(username);
            }
            await updateProfileStats();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error unfollowing user:', error);
        return false;
    }
}

async function checkFollowStatus(username) {
    try {
        const response = await fetchWithAuth(`/follows/check/${username}`);
        return await response.json();
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
}

async function sendFriendRequest(username) {
    try {
        const response = await fetchWithAuth(`/friends/requests/${username}`, {
            method: 'POST'
        });

        if (response.ok) {
            const friendBtn = document.getElementById('friendBtn');
            if (friendBtn) {
                friendBtn.textContent = 'Request Sent';
                friendBtn.disabled = true;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending friend request:', error);
        return false;
    }
}

async function checkFriendStatus(username) {
    try {
        const response = await fetchWithAuth(`/friends/check/${username}`);
        return await response.json();
    } catch (error) {
        console.error('Error checking friend status:', error);
        return false;
    }
}

async function getFollowing() {
    try {
        const response = await fetchWithAuth('/follows/following');
        return await response.json();
    } catch (error) {
        console.error('Error getting following list:', error);
        return [];
    }
}

async function getFollowers() {
    try {
        const response = await fetchWithAuth('/follows/followers');
        return await response.json();
    } catch (error) {
        console.error('Error getting followers list:', error);
        return [];
    }
}

async function getFriends() {
    try {
        const response = await fetchWithAuth('/friends');
        return await response.json();
    } catch (error) {
        console.error('Error getting friends list:', error);
        return [];
    }
}

async function getPendingFriendRequests() {
    try {
        const response = await fetchWithAuth('/friends/requests/pending');
        return await response.json();
    } catch (error) {
        console.error('Error getting pending friend requests:', error);
        return [];
    }
}

async function acceptFriendRequest(requestId) {
    try {
        const response = await fetchWithAuth(`/friends/requests/${requestId}/accept`, {
            method: 'POST'
        });
        return response.ok;
    } catch (error) {
        console.error('Error accepting friend request:', error);
        return false;
    }
}

async function rejectFriendRequest(requestId) {
    try {
        const response = await fetchWithAuth(`/friends/requests/${requestId}/reject`, {
            method: 'POST'
        });
        return response.ok;
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        return false;
    }
}

// Setup event listeners
function setupEventListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('jwt_token');
            window.location.href = '/login?logout=true';
        });
    } else {
        console.error('logoutBtn not found');
    }

    const bioInput = document.getElementById('bioInput');
    if (bioInput) {
        bioInput.addEventListener('input', () => {
            const bioCharCount = document.getElementById('bioCharCount');
            if (bioCharCount) {
                bioCharCount.textContent = bioInput.value.length;
            }
        });
    }

    const avatarUrlInput = document.getElementById('avatarUrlInput');
    if (avatarUrlInput) {
        avatarUrlInput.addEventListener('input', () => {
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.src = avatarUrlInput.value || '/media/files/raw.png';
            }
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
            const deleteModal = document.getElementById('deleteModal');
            if (deleteModal) {
                deleteModal.style.display = 'none';
            }
            postIdToDelete = null;
        });
    }

    const followersItem = document.getElementById('followersItem');
    if (followersItem) {
        followersItem.addEventListener('click', () => showRelationshipsModal('followers'));
    }

    const followingItem = document.getElementById('followingItem');
    if (followingItem) {
        followingItem.addEventListener('click', () => showRelationshipsModal('following'));
    }

    const friendsItem = document.getElementById('friendsItem');
    if (friendsItem) {
        friendsItem.addEventListener('click', () => showRelationshipsModal('friends'));
    }

    const closeRelationshipsModal = document.getElementById('closeRelationshipsModal');
    if (closeRelationshipsModal) {
        closeRelationshipsModal.addEventListener('click', () => {
            const relationshipsModal = document.getElementById('relationshipsModal');
            if (relationshipsModal) {
                relationshipsModal.style.display = 'none';
            }
        });
    }

    const followersTab = document.getElementById('followersTab');
    if (followersTab) {
        followersTab.addEventListener('click', () => showRelationshipsModal('followers'));
    }

    const followingTab = document.getElementById('followingTab');
    if (followingTab) {
        followingTab.addEventListener('click', () => showRelationshipsModal('following'));
    }

    const friendsTab = document.getElementById('friendsTab');
    if (friendsTab) {
        friendsTab.addEventListener('click', () => showRelationshipsModal('friends'));
    }

    setupPostModal();
}

// Initialize
async function init() {
    console.log('Starting init');
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
    console.log('Checking DOM elements:');
    console.log('profileUsername:', document.getElementById('profileUsername'));
    console.log('recentPostsContainer:', document.getElementById('recentPostsContainer'));
    console.log('logoutBtn:', document.getElementById('logoutBtn'));

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