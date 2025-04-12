// Global variables
let stompClient = null;
let currentUsername = null;
let currentConversationId = null;
let conversations = [];
let token = localStorage.getItem('jwt_token');

// Check if the user is authenticated
(function checkAuth() {
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Get current user info
    getCurrentUser();
})();

// Initialize the chat application
function initializeChat() {
    // Set up event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('newChatBtn').addEventListener('click', showNewChatModal);
    document.getElementById('cancelNewChat').addEventListener('click', hideNewChatModal);
    document.getElementById('createNewChat').addEventListener('click', createNewConversation);
    document.querySelector('.close-modal').addEventListener('click', hideNewChatModal);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);

    // Message input auto-resize and enter key handling
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', autoResizeTextarea);
    messageInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Search functionality
    document.getElementById('searchConversations').addEventListener('input', filterConversations);

    // Load user's conversations
    loadConversations();
}

// Get current user information
async function getCurrentUser() {
    try {
        const response = await fetchWithAuth('/auth/me');
        const userData = await response.json();
        currentUsername = userData.username;
        console.log('Current user:', currentUsername);

        // Initialize the chat after getting user info
        initializeChat();
    } catch (error) {
        console.error('Error fetching current user:', error);
        logout();
    }
}

// Fetch with authentication wrapper
async function fetchWithAuth(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

// Load user's conversations
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '<div class="loading-indicator">Загрузка импульсов...</div>';

    try {
        const response = await fetchWithAuth('/conversations/list');
        conversations = await response.json();

        if (conversations.length === 0) {
            conversationsList.innerHTML = '<div class="loading-indicator">У вас пока нет бесед</div>';
            return;
        }

        renderConversationsList(conversations);

        // If there's a conversation ID in URL, open it
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'chat') {
            const conversationId = parseInt(pathParts[2]);
            if (!isNaN(conversationId)) {
                const conversation = conversations.find(c => c.id === conversationId);
                if (conversation) {
                    openConversation(conversation);
                }
            }
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsList.innerHTML = '<div class="loading-indicator">Ошибка загрузки бесед</div>';
    }
}

// Render the list of conversations
function renderConversationsList(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '';

    conversations.forEach(conversation => {
        const conversationElement = document.createElement('div');
        conversationElement.className = 'conversation-item';
        conversationElement.dataset.id = conversation.id;

        const lastMessagePreview = conversation.lastMessage ?
            conversation.lastMessage.sender + ': ' + conversation.lastMessage.content :
            'Нет сообщений';

        const lastMessageTime = conversation.lastMessage ?
            formatTime(conversation.lastMessage.sentAt) :
            formatTime(conversation.createdAt);

        // Remove current user from participants list for display
        const otherParticipants = conversation.participants
            .filter(p => p !== currentUsername)
            .join(', ');

        conversationElement.innerHTML = `
            <div class="conversation-title">
                <span>${conversation.title}</span>
                ${conversation.unreadCount > 0 ?
            `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
            </div>
            <div class="conversation-participants">${otherParticipants}</div>
            <div class="conversation-preview">${lastMessagePreview}</div>
            <div class="conversation-time">${lastMessageTime}</div>
        `;

        conversationElement.addEventListener('click', () => openConversation(conversation));
        conversationsList.appendChild(conversationElement);
    });
}

// Open a conversation
function openConversation(conversation) {
    // Update UI to show active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    const conversationElement = document.querySelector(`.conversation-item[data-id="${conversation.id}"]`);
    if (conversationElement) {
        conversationElement.classList.add('active');
        // Remove unread count badge
        const unreadBadge = conversationElement.querySelector('.unread-count');
        if (unreadBadge) {
            unreadBadge.remove();
        }
    }

    // Show active chat header and hide default header
    document.getElementById('defaultHeader').style.display = 'none';
    document.getElementById('activeChatHeader').style.display = 'block';

    // Update chat header with conversation info
    document.getElementById('chatTitle').textContent = conversation.title;

    // Filter out current user from participants for display
    const otherParticipants = conversation.participants
        .filter(p => p !== currentUsername)
        .join(', ');

    document.getElementById('chatParticipants').textContent = 'Участники: ' + otherParticipants;

    // Show messages container and input
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('messagesList').style.display = 'flex';
    document.getElementById('messageInputContainer').style.display = 'flex';

    // Store current conversation ID
    currentConversationId = conversation.id;

    // Update URL without reloading the page
    const newUrl = `/chat/${conversation.id}`;
    window.history.pushState({ conversationId: conversation.id }, '', newUrl);

    // Load messages for this conversation
    loadMessages(conversation.id);

    // Connect to WebSocket for this conversation if not already connected
    connectToChat(conversation.id);
}

// Load messages for a conversation
async function loadMessages(conversationId) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '<div class="loading-indicator">Загрузка сообщений...</div>';

    try {
        const response = await fetchWithAuth(`/messages/conversation/${conversationId}`);
        const messages = await response.json();

        if (messages.length === 0) {
            messagesList.innerHTML = '<div class="loading-indicator">Нет сообщений</div>';
            return;
        }

        renderMessages(messages);

        // Scroll to the bottom of the messages list
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesList.innerHTML = '<div class="loading-indicator">Ошибка загрузки сообщений</div>';
    }
}

// Render messages in the chat
function renderMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    let previousDate = null;

    messages.forEach(message => {
        // Check if we need to add a date separator
        const messageDate = new Date(message.sentAt).toLocaleDateString();
        if (messageDate !== previousDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.textContent = formatDate(message.sentAt);
            messagesList.appendChild(dateSeparator);
            previousDate = messageDate;
        }

        const messageElement = document.createElement('div');
        messageElement.className = `message-bubble ${message.sender === currentUsername ? 'outgoing' : 'incoming'}`;

        messageElement.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-content">${message.content}</div>
            <div class="message-time">${formatTime(message.sentAt)}</div>
        `;

        messagesList.appendChild(messageElement);
    });
}

// Connect to WebSocket
function connectToChat(conversationId) {
    // Disconnect if already connected
    if (stompClient) {
        stompClient.disconnect();
    }

    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect(
        { 'Authorization': `Bearer ${token}` },
        frame => {
            console.log('Connected to WebSocket:', frame);

            // Subscribe to the conversation topic
            stompClient.subscribe(`/topic/conversation.${conversationId}`, onMessageReceived);

            // Notify server that user joined the chat
            stompClient.send("/app/chat.join", {}, JSON.stringify(conversationId));
        },
        error => {
            console.error('WebSocket connection error:', error);
            setTimeout(() => {
                connectToChat(conversationId);
            }, 5000); // Try to reconnect after 5 seconds
        }
    );
}

// Handle received WebSocket messages
function onMessageReceived(payload) {
    const data = JSON.parse(payload.body);
    console.log('Message received:', data);

    if (data.type === 'MESSAGE' && data.message) {
        // Check if the message is for the current conversation
        if (data.message.conversationId === currentConversationId) {
            const messagesList = document.getElementById('messagesList');

            // Get the date of the last message
            const lastDateSeparator = messagesList.querySelector('.date-separator:last-child');
            const lastMessageDate = lastDateSeparator ?
                lastDateSeparator.textContent :
                null;

            // Check if we need to add a new date separator
            const messageDate = formatDate(data.message.sentAt);
            if (messageDate !== lastMessageDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'date-separator';
                dateSeparator.textContent = messageDate;
                messagesList.appendChild(dateSeparator);
            }

            // Create and append the new message
            const messageElement = document.createElement('div');
            messageElement.className = `message-bubble ${data.message.sender === currentUsername ? 'outgoing' : 'incoming'}`;

            messageElement.innerHTML = `
                <div class="message-sender">${data.message.sender}</div>
                <div class="message-content">${data.message.content}</div>
                <div class="message-time">${formatTime(data.message.sentAt)}</div>
            `;

            messagesList.appendChild(messageElement);

            // Scroll to the bottom
            scrollToBottom();
        } else {
            // Message is for another conversation, update the unread count
            updateConversationPreview(data.message);
        }
    } else if (data.type === 'JOIN') {
        // Handle user join notification if needed
        console.log('User joined the conversation');
    }
}

// Update conversation preview when a new message arrives
function updateConversationPreview(message) {
    const conversation = conversations.find(c => c.id === message.conversationId);
    if (conversation) {
        // Update the conversation's last message
        conversation.lastMessage = message;

        // Update unread count if the message is not from current user
        if (message.sender !== currentUsername) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Move this conversation to the top of the list
        conversations = [
            conversation,
            ...conversations.filter(c => c.id !== message.conversationId)
        ];

        // Re-render conversations list
        renderConversationsList(conversations);
    }
}

// Send a message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content || !currentConversationId) {
        return;
    }

    const messageData = {
        conversationId: currentConversationId,
        content: content
    };

    try {
        // Clear input field before sending
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Use WebSocket to send message if connected
        if (stompClient && stompClient.connected) {
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(messageData));
        } else {
            // Fallback to REST API if WebSocket is not connected
            sendMessageREST(messageData);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Fallback to REST API on error
        sendMessageREST(messageData);
    }
}

// Send message using REST API (fallback)
async function sendMessageREST(messageData) {
    try {
        const response = await fetchWithAuth('/messages/send', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });

        const message = await response.json();
        console.log('Message sent via REST:', message);

        // Manually append the message to the chat
        const messagesList = document.getElementById('messagesList');

        const messageElement = document.createElement('div');
        messageElement.className = 'message-bubble outgoing';

        messageElement.innerHTML = `
            <div class="message-sender">${currentUsername}</div>
            <div class="message-content">${messageData.content}</div>
            <div class="message-time">${formatTime(new Date())}</div>
        `;

        messagesList.appendChild(messageElement);
        scrollToBottom();

    } catch (error) {
        console.error('Error sending message via REST:', error);
        alert('Ошибка отправки сообщения. Пожалуйста, попробуйте еще раз.');
    }
}

// Create new conversation
async function createNewConversation() {
    const titleInput = document.getElementById('chatTitleInput');
    const participantsInput = document.getElementById('participantsInput');

    const title = titleInput.value.trim();
    const participantsText = participantsInput.value.trim();

    if (!title) {
        alert('Пожалуйста, введите название беседы');
        return;
    }

    if (!participantsText) {
        alert('Пожалуйста, добавьте хотя бы одного участника');
        return;
    }

    // Parse participants (comma separated)
    const participants = participantsText.split(',')
        .map(username => username.trim())
        .filter(username => username && username !== currentUsername);

    // Add current user to participants
    participants.push(currentUsername);

    const conversationData = {
        title: title,
        participants: participants
    };

    try {
        const response = await fetchWithAuth('/conversations/create', {
            method: 'POST',
            body: JSON.stringify(conversationData)
        });

        const newConversation = await response.json();
        console.log('New conversation created:', newConversation);

        // Add to conversations and rerender list
        conversations.unshift(newConversation);
        renderConversationsList(conversations);

        // Open the new conversation
        openConversation(newConversation);

        // Hide modal
        hideNewChatModal();

    } catch (error) {
        console.error('Error creating conversation:', error);
        alert('Ошибка создания беседы. Пожалуйста, проверьте имена участников и попробуйте снова.');
    }
}

// Show modal for creating new chat
function showNewChatModal() {
    document.getElementById('newChatModal').style.display = 'flex';
    document.getElementById('chatTitleInput').focus();
}

// Hide new chat modal
function hideNewChatModal() {
    document.getElementById('newChatModal').style.display = 'none';
    document.getElementById('chatTitleInput').value = '';
    document.getElementById('participantsInput').value = '';
}

// Auto-resize textarea for message input
function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Filter conversations by search input
function filterConversations() {
    const searchText = document.getElementById('searchConversations').value.toLowerCase().trim();

    if (!searchText) {
        renderConversationsList(conversations);
        return;
    }

    const filteredConversations = conversations.filter(conversation => {
        return conversation.title.toLowerCase().includes(searchText) ||
            conversation.participants.some(p => p.toLowerCase().includes(searchText));
    });

    renderConversationsList(filteredConversations);
}

// Scroll to the bottom of the messages container
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format date for messages
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Today
    if (date.toDateString() === now.toDateString()) {
        return 'Сегодня';
    }
    // Yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    }
    // Other dates
    else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Format time for messages
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logout function
function logout() {
    localStorage.removeItem('jwt_token');
    window.location.href = '/login?logout=true';
}

// Handle browser back/forward navigation
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.conversationId) {
        const conversation = conversations.find(c => c.id === event.state.conversationId);
        if (conversation) {
            openConversation(conversation);
        }
    } else {
        // Default view when no conversation is selected
        document.getElementById('defaultHeader').style.display = 'block';
        document.getElementById('activeChatHeader').style.display = 'none';
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('messagesList').style.display = 'none';
        document.getElementById('messageInputContainer').style.display = 'none';
        currentConversationId = null;

        // Deselect any active conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
    }
});