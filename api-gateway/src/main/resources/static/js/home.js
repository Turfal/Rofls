const token = localStorage.getItem('jwt_token');
if (!token) {
    window.location.href = '/login';
}

let currentUser = null;
let postIdToRepost = null;
let postIdToDelete = null;
let selectedMedia = null;
let mediaType = null;
let feedType = 'forYou'; // 'forYou' or 'following'

// Fetch wrapper with authentication
async function fetchWithAuth(url, options = {}) {
    // Don't modify headers for FormData/multipart
    if (options.body instanceof FormData) {
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        return fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
    }

    // Regular JSON request
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
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

        // Set the first letter of username as avatar
        const usernameInitial = document.getElementById('username-initial');
        if (usernameInitial && currentUser.username) {
            usernameInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        }

        // Update profile link
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.href = `/profile/username/${currentUser.username}`;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
    }
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

if (searchInput && searchResults) {
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
}

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

    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            postModal.style.display = 'flex';
            postTextArea.focus();
        });
    }

    if (cancelPostBtn) {
        cancelPostBtn.addEventListener('click', () => {
            postModal.style.display = 'none';
            resetPostForm();
        });
    }

    if (postTextArea) {
        postTextArea.addEventListener('input', () => {
            const length = postTextArea.value.length;
            charCount.textContent = length;
            charCount.style.color = length > 250 ? '#ff4d4d' : '#888';
        });
    }

    if (attachMediaBtn && postMediaUpload) {
        attachMediaBtn.addEventListener('click', () => {
            postMediaUpload.click();
        });
    }

    if (postMediaUpload) {
        postMediaUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                selectedMedia = file;
                mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

                if (mediaType && previewContainer) {
                    previewContainer.innerHTML = mediaType === 'image' ?
                        `<img src="${URL.createObjectURL(file)}" alt="Preview">` :
                        `<video controls><source src="${URL.createObjectURL(file)}" type="${file.type}"></video>`;

                    if (mediaPreview) {
                        mediaPreview.style.display = 'block';
                    }
                }
            }
        });
    }

    if (removeMediaBtn) {
        removeMediaBtn.addEventListener('click', () => {
            selectedMedia = null;
            mediaType = null;
            if (postMediaUpload) {
                postMediaUpload.value = '';
            }
            if (mediaPreview) {
                mediaPreview.style.display = 'none';
            }
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
        });
    }

    if (submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            const postText = postTextArea.value.trim();
            if (!postText && !selectedMedia) {
                alert('Please enter text or attach media');
                return;
            }

            try {
                let mediaUrl = null;

                // If there's media, upload it first
                if (selectedMedia) {
                    const formData = new FormData();
                    formData.append('file', selectedMedia);

                    const response = await fetchWithAuth('/media/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const mediaData = await response.json();
                    mediaUrl = mediaData.imageUrl;
                }

                // Create the post with media if applicable
                const postData = {
                    content: postText,
                    mediaUrl: mediaUrl,
                    mediaType: mediaType
                };

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
    }

    function resetPostForm() {
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
}

// Load Posts
let isLoadingPosts = false;

async function loadPosts() {
    if (isLoadingPosts) return;
    isLoadingPosts = true;

    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) {
        isLoadingPosts = false;
        return;
    }

    postsContainer.innerHTML = '<div class="loading-indicator">Loading posts...</div>';

    try {
        const url = feedType === 'forYou' ? '/posts/all' : '/posts/following';
        const response = await fetchWithAuth(url);
        const posts = await response.json();

        // Get comment counts for each post
        const postsWithComments = await Promise.all(posts.map(async post => {
            try {
                const countResponse = await fetchWithAuth(`/comments/count/${post.id}`);
                post.commentCount = await countResponse.json();
            } catch (error) {
                console.error(`Error fetching comment count for post ${post.id}:`, error);
                post.commentCount = 0;
            }
            return post;
        }));

        postsContainer.innerHTML = '';

        if (postsWithComments.length === 0) {
            postsContainer.innerHTML = '<div class="no-posts">No posts found</div>';
            isLoadingPosts = false;
            return;
        }

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

    // Use default avatar if none provided
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
            <button class="repost-btn" data-id="${post.id}">
                <span class="repost-icon">🔄</span> Repost
            </button>
            ${post.username === currentUser?.username ?
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
    if (!commentsList) return;

    commentsList.innerHTML = '<div class="loading-indicator">Loading comments...</div>';

    try {
        const response = await fetchWithAuth(`/comments/post/${postId}`);
        const comments = await response.json();

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">No comments yet</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            // Use default avatar if none provided
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

        // Add event listeners for comment deletion
        commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.currentTarget.dataset.id;
                showDeleteCommentModal(commentId, postId);
            });
        });
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsList.innerHTML = '<div class="error">Failed to load comments</div>';
    }
}

function showDeleteCommentModal(commentId, postId) {
    // Create modal if it doesn't exist
    let modalOverlay = document.querySelector('.comment-delete-modal-overlay');

    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
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
    }

    modalOverlay.style.display = 'flex';

    // Update event listeners with the current commentId and postId
    const confirmBtn = document.getElementById('confirm-delete-comment');
    const cancelBtn = document.getElementById('cancel-delete-comment');

    // Remove existing listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new listeners
    newConfirmBtn.addEventListener('click', async () => {
        try {
            await fetchWithAuth(`/comments/delete/${commentId}`, { method: 'DELETE' });
            await loadComments(postId);
            await updateCommentCount(postId);
            modalOverlay.style.display = 'none';
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    });

    newCancelBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });
}

async function submitComment(postId) {
    const textarea = document.getElementById(`comment-textarea-${postId}`);
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) return;

    try {
        await fetchWithAuth('/comments/create', {
            method: 'POST',
            body: JSON.stringify({ postId, content })
        });
        textarea.value = '';
        await loadComments(postId);
        await updateCommentCount(postId);
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment');
    }
}

async function updateCommentCount(postId) {
    try {
        const response = await fetchWithAuth(`/comments/count/${postId}`);
        const count = await response.json();
        const countElement = document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`);
        if (countElement) {
            countElement.textContent = `(${count})`;
        }
    } catch (error) {
        console.error('Error updating comment count:', error);
    }
}

// Delete Post
async function deletePost() {
    if (!postIdToDelete) return;

    try {
        // Delete the post
        await fetchWithAuth(`/posts/delete/${postIdToDelete}`, { method: 'DELETE' });

        // Remove the post element from the DOM
        const postElement = document.querySelector(`.post-item[data-post-id="${postIdToDelete}"]`);
        if (postElement) {
            postElement.remove();
        }

        // Hide the modal
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }

        // Success message
        alert('Post deleted successfully');
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post: ' + error.message);
    } finally {
        postIdToDelete = null;
    }
}

// Repost functionality
function showRepostModal(postId) {
    // Create modal for repost options if it doesn't exist
    let repostModal = document.getElementById('repostModal');

    if (!repostModal) {
        repostModal = document.createElement('div');
        repostModal.id = 'repostModal';
        repostModal.className = 'modal';

        repostModal.innerHTML = `
            <div class="modal-core">
                <div class="modal-head">
                    <h2>Repost Options</h2>
                    <button id="closeRepostModal" class="close-node">×</button>
                </div>
                <div class="repost-options">
                    <button id="repostToFeed" class="repost-option">
                        <i class="fas fa-stream"></i> Repost to feed
                    </button>
                    <button id="repostToChat" class="repost-option">
                        <i class="fas fa-comments"></i> Share in conversation
                    </button>
                </div>
                <div id="chatSelectContainer" style="display: none; margin-top: 15px;">
                    <select id="conversationSelect" class="conversation-select">
                        <option value="">Select a conversation...</option>
                    </select>
                    <button id="confirmRepostToChat" class="submit-node" style="margin-top: 10px;">Share</button>
                </div>
            </div>
        `;

        document.body.appendChild(repostModal);

        // Add event listeners
        document.getElementById('closeRepostModal').addEventListener('click', () => {
            repostModal.style.display = 'none';
        });

        document.getElementById('repostToFeed').addEventListener('click', () => {
            repostToFeed(postIdToRepost);
        });

        document.getElementById('repostToChat').addEventListener('click', loadConversationsForRepost);

        document.getElementById('confirmRepostToChat').addEventListener('click', () => {
            const conversationId = document.getElementById('conversationSelect').value;
            if (conversationId) {
                repostToChat(postIdToRepost, conversationId);
            } else {
                alert('Please select a conversation');
            }
        });
    }

    // Set the post ID and show the modal
    postIdToRepost = postId;
    repostModal.style.display = 'flex';
    document.getElementById('chatSelectContainer').style.display = 'none';
}

async function loadConversationsForRepost() {
    const chatSelectContainer = document.getElementById('chatSelectContainer');
    chatSelectContainer.style.display = 'block';

    try {
        const response = await fetchWithAuth('/conversations/list');
        const conversations = await response.json();

        const select = document.getElementById('conversationSelect');
        select.innerHTML = '<option value="">Select a conversation...</option>';

        if (conversations.length === 0) {
            select.innerHTML += '<option disabled>No conversations available</option>';
            return;
        }

        conversations.forEach(conv => {
            const option = document.createElement('option');
            option.value = conv.id;
            option.textContent = conv.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
        alert('Failed to load conversations');
    }
}

async function repostToFeed(postId) {
    try {
        // Fetch the original post
        const response = await fetchWithAuth(`/posts/${postId}`);
        const post = await response.json();

        // Create a new post with attribution
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

        // Close modal and refresh feed
        document.getElementById('repostModal').style.display = 'none';
        loadPosts();

        // Show success message
        alert('Post reposted successfully!');
    } catch (error) {
        console.error('Error reposting to feed:', error);
        alert('Failed to repost. Please try again.');
    }
}

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

        // Close modal
        document.getElementById('repostModal').style.display = 'none';

        // Show success message
        alert('Post shared in conversation successfully!');
    } catch (error) {
        console.error('Error sharing to conversation:', error);
        alert('Failed to share. Please try again.');
    }
}

// Event Listeners
function addPostEventListeners() {
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const postId = e.currentTarget.dataset.id;
            const likeCountSpan = e.currentTarget.querySelector('.like-count');
            let count = parseInt(likeCountSpan.textContent);
            e.currentTarget.classList.toggle('liked');
            likeCountSpan.textContent = e.currentTarget.classList.contains('liked') ? count + 1 : count - 1;
        });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const postId = e.currentTarget.dataset.id;
            const commentsSection = document.getElementById(`comments-section-${postId}`);
            commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
            if (commentsSection.style.display === 'block') loadComments(postId);
        });
    });

    // Repost buttons
    document.querySelectorAll('.repost-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const postId = e.currentTarget.dataset.id;
            showRepostModal(postId);
        });
    });

    // Comment submit buttons
    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', e => submitComment(e.currentTarget.dataset.id));
    });

    // Delete post buttons
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            postIdToDelete = e.currentTarget.dataset.id;
            document.getElementById('deleteModal').style.display = 'flex';
        });
    });
}

// Navigation between sections
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.matrix-node');
    if (!navItems) return;

    navItems.forEach(item => {
        item.addEventListener('click', e => {
            if (e.currentTarget.id === 'logoutBtn' || e.currentTarget.id === 'profileLink') return;

            navItems.forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');

            const section = e.currentTarget.dataset.section;
            document.querySelectorAll('.flux-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}Section`).classList.add('active');
        });
    });
}

// Feed type switching (For You / Following)
function setupFeedTypeSwitching() {
    const forYouBtn = document.getElementById('forYouBtn');
    const followingBtn = document.getElementById('followingBtn');

    if (forYouBtn) {
        forYouBtn.addEventListener('click', () => {
            feedType = 'forYou';
            forYouBtn.classList.add('active');
            if (followingBtn) followingBtn.classList.remove('active');
            loadPosts();
        });
    }

    if (followingBtn) {
        followingBtn.addEventListener('click', () => {
            feedType = 'following';
            followingBtn.classList.add('active');
            if (forYouBtn) forYouBtn.classList.remove('active');
            loadPosts();
        });
    }
}

// Handle delete confirmation modal
function setupDeleteModal() {
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deletePost);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
            postIdToDelete = null;
        });
    }
}

// Helper Functions
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
        // Less than a day ago - show hours or minutes
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return diffMinutes === 0 ? 'just now' : `${diffMinutes}m ago`;
        }
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        // Less than a week ago - show days
        return `${diffDays}d ago`;
    } else {
        // More than a week ago - show full date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

function getFormattedMediaUrl(mediaUrl) {
    if (!mediaUrl) return null;
    if (mediaUrl.startsWith('/media/files/') || mediaUrl.startsWith('/pixflow-media/')) return mediaUrl;
    return `/media/files/${mediaUrl.split('/').pop()}`;
}

// Load trends and suggested users
async function loadTrends() {
    const trendsContainer = document.getElementById('trendsContainer');
    if (!trendsContainer) return;

    try {
        // This is a placeholder - implement actual trend fetching once API is available
        const trends = [
            { name: '#minimalism', count: 120 },
            { name: '#monochrome', count: 89 },
            { name: '#design', count: 76 },
            { name: '#ui', count: 54 },
            { name: '#simplicity', count: 42 }
        ];

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
    if (!suggestedUsers) return;

    try {
        // This is a placeholder - implement actual user suggestion fetching once API is available
        const users = [
            { username: 'designer42', id: 1 },
            { username: 'creative_mind', id: 2 },
            { username: 'ui_explorer', id: 3 },
            { username: 'minimal_art', id: 4 }
        ];

        suggestedUsers.innerHTML = users.map(user => `
            <div class="suggested-user">
                <a href="/profile/username/${user.username}">${user.username}</a>
                <button class="follow-btn" data-id="${user.id}">Follow</button>
            </div>
        `).join('');

        // Add event listeners to follow buttons
        suggestedUsers.querySelectorAll('.follow-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.currentTarget.dataset.id;
                try {
                    // Implement follow functionality once API is available
                    e.currentTarget.textContent = 'Following';
                    e.currentTarget.disabled = true;
                } catch (error) {
                    console.error('Error following user:', error);
                }
            });
        });
    } catch (error) {
        console.error('Error loading suggested users:', error);
        suggestedUsers.innerHTML = '<div class="error">Failed to load suggestions</div>';
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        await getCurrentUser();
        setupPostModal();
        setupTabNavigation();
        setupFeedTypeSwitching();
        setupDeleteModal();

        await loadPosts();
        await loadTrends();
        await loadSuggestedUsers();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});