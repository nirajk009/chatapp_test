/* ===================================================
   OPUS CHAT — JavaScript Logic
   Features: Contacts, messaging, auto-reply, emoji,
             typing indicator, localStorage persistence
   =================================================== */

// ─────────────── DATA ───────────────
const CONTACTS = [
    {
        id: 'alice',
        name: 'Alice Johnson',
        avatar: 'A',
        avatarClass: 'avatar-0',
        online: true,
        status: 'Online',
    },
    {
        id: 'bob',
        name: 'Bob Williams',
        avatar: 'B',
        avatarClass: 'avatar-1',
        online: true,
        status: 'Online',
    },
    {
        id: 'charlie',
        name: 'Charlie Davis',
        avatar: 'C',
        avatarClass: 'avatar-2',
        online: false,
        status: 'Last seen 2h ago',
    },
    {
        id: 'diana',
        name: 'Diana Lee',
        avatar: 'D',
        avatarClass: 'avatar-3',
        online: true,
        status: 'Online',
    },
    {
        id: 'ethan',
        name: 'Ethan Brown',
        avatar: 'E',
        avatarClass: 'avatar-4',
        online: false,
        status: 'Last seen yesterday',
    },
    {
        id: 'fiona',
        name: 'Fiona Garcia',
        avatar: 'F',
        avatarClass: 'avatar-5',
        online: true,
        status: 'Online',
    },
];

// Sample conversations
const DEFAULT_MESSAGES = {
    alice: [
        { from: 'them', text: 'Hey! How are you doing? 😊', time: '10:00 AM' },
        { from: 'me', text: 'I\'m great, thanks! Working on a new project.', time: '10:02 AM' },
        { from: 'them', text: 'Oh cool! What kind of project?', time: '10:03 AM' },
        { from: 'me', text: 'A chat application with a beautiful blue theme ✨', time: '10:05 AM' },
        { from: 'them', text: 'That sounds awesome! Can\'t wait to see it!', time: '10:06 AM' },
    ],
    bob: [
        { from: 'them', text: 'Did you catch the game last night? 🏀', time: '9:30 AM' },
        { from: 'me', text: 'Yes! What a finish!', time: '9:32 AM' },
        { from: 'them', text: 'I know right! That last play was insane', time: '9:33 AM' },
    ],
    charlie: [
        { from: 'me', text: 'Hey Charlie, are we still on for tomorrow?', time: 'Yesterday' },
        { from: 'them', text: 'Absolutely! See you at 3 PM 👍', time: 'Yesterday' },
    ],
    diana: [
        { from: 'them', text: 'Just finished the design mockups! 🎨', time: '11:15 AM' },
        { from: 'me', text: 'Send them over! I\'d love to take a look', time: '11:17 AM' },
        { from: 'them', text: 'Sent! Let me know what you think 😄', time: '11:18 AM' },
    ],
    ethan: [
        { from: 'them', text: 'Thanks for helping me debug that issue 🙏', time: 'Monday' },
        { from: 'me', text: 'No problem at all! Happy to help.', time: 'Monday' },
    ],
    fiona: [
        { from: 'them', text: 'The presentation went really well!', time: '8:45 AM' },
        { from: 'me', text: 'That\'s great to hear! You crushed it! 🎉', time: '8:47 AM' },
        { from: 'them', text: 'Couldn\'t have done it without the team', time: '8:48 AM' },
        { from: 'me', text: 'We should celebrate! Lunch today?', time: '8:50 AM' },
        { from: 'them', text: 'I\'m in! 🍕', time: '8:51 AM' },
    ],
};

// Auto-reply pool
const AUTO_REPLIES = [
    'That\'s really interesting! Tell me more 😄',
    'Haha, I totally agree! 😂',
    'Sounds great! Let\'s do it 👍',
    'I was just thinking about that!',
    'No way! That\'s awesome 🎉',
    'Good point! I hadn\'t considered that.',
    'Sure, I\'m free whenever you are 😊',
    'Love that idea! ✨',
    'Hmm, let me think about it for a sec...',
    'You always come up with the best plans! 🙌',
    'Right? It\'s so cool!',
    'I\'ll get back to you on that soon',
    'That made my day! 😄',
    'Can\'t wait! This is going to be fun 🚀',
    'Absolutely! Count me in!',
];

// Emoji set
const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡',
    '👍', '👎', '👋', '🙌', '💪', '🙏', '❤️', '💔',
    '🔥', '⭐', '✨', '🎉', '🎊', '💯', '🚀', '💡',
    '☀️', '🌙', '🌈', '🍕', '🍔', '☕', '🎵', '📱',
    '💻', '🎮', '📚', '✅', '❌', '⚡', '💬', '😊',
];

// ─────────────── STATE ───────────────
let activeContactId = null;
let chatHistory = {};
let typingTimeout = null;

// ─────────────── DOM REFS ───────────────
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const contactsList = document.getElementById('contactsList');
const searchInput = document.getElementById('searchInput');

const chatHeader = document.getElementById('chatHeader');
const headerAvatar = document.getElementById('headerAvatar');
const headerAvatarLetter = document.getElementById('headerAvatarLetter');
const headerOnlineDot = document.getElementById('headerOnlineDot');
const headerName = document.getElementById('headerName');
const headerStatus = document.getElementById('headerStatus');
const chatHeaderInfo = document.getElementById('chatHeaderInfo');

const welcomeScreen = document.getElementById('welcomeScreen');
const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const messageInputBar = document.getElementById('messageInputBar');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiGrid = document.getElementById('emojiGrid');
const typingIndicator = document.getElementById('typingIndicator');
const typingAvatar = document.getElementById('typingAvatar');

// ─────────────── INIT ───────────────
function init() {
    loadChatHistory();
    renderContacts();
    buildEmojiPicker();
    bindEvents();

    // Auto-select first contact
    if (CONTACTS.length > 0) {
        selectContact(CONTACTS[0].id);
    }
}

// ─────────────── LOCAL STORAGE ───────────────
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('opus_chat_history');
        if (saved) {
            chatHistory = JSON.parse(saved);
        } else {
            chatHistory = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
        }
    } catch (e) {
        chatHistory = JSON.parse(JSON.stringify(DEFAULT_MESSAGES));
    }

    // Ensure all contacts have a history array
    CONTACTS.forEach(c => {
        if (!chatHistory[c.id]) {
            chatHistory[c.id] = DEFAULT_MESSAGES[c.id] ? [...DEFAULT_MESSAGES[c.id]] : [];
        }
    });
}

function saveChatHistory() {
    try {
        localStorage.setItem('opus_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
        // ignore
    }
}

// ─────────────── CONTACTS ───────────────
function renderContacts(filter = '') {
    const lowerFilter = filter.toLowerCase();
    const filtered = CONTACTS.filter(c =>
        c.name.toLowerCase().includes(lowerFilter)
    );

    contactsList.innerHTML = filtered.map((contact, i) => {
        const msgs = chatHistory[contact.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = contact.id === activeContactId;
        const unread = getUnreadCount(contact.id);

        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-id="${contact.id}"
                 style="animation-delay: ${i * 0.04}s">
                <div class="avatar ${contact.avatarClass}">
                    <span>${contact.avatar}</span>
                    ${contact.online ? '<div class="online-dot"></div>' : ''}
                </div>
                <div class="contact-details">
                    <div class="contact-top-row">
                        <span class="contact-name">${contact.name}</span>
                        <span class="contact-time">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="contact-bottom-row">
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 35) : 'Start a conversation'}</span>
                        ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getUnreadCount(contactId) {
    // Simulate some unread counts for initial visual appeal
    if (contactId === activeContactId) return 0;
    const counts = { bob: 2, diana: 1, fiona: 3 };
    return counts[contactId] || 0;
}

function truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '…' : str;
}

// ─────────────── SELECT CONTACT ───────────────
function selectContact(contactId) {
    activeContactId = contactId;
    const contact = CONTACTS.find(c => c.id === contactId);
    if (!contact) return;

    // Update header
    headerAvatarLetter.textContent = contact.avatar;
    headerAvatar.className = `avatar avatar-header ${contact.avatarClass}`;
    headerOnlineDot.style.display = contact.online ? 'block' : 'none';
    headerName.textContent = contact.name;
    headerStatus.textContent = contact.status;

    // Update typing avatar
    typingAvatar.textContent = contact.avatar;

    // Show chat area, hide welcome
    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = '';
    messageInputBar.style.display = '';

    // Render messages
    renderMessages();

    // Update active state in contact list
    renderContacts(searchInput.value);

    // Close sidebar on mobile
    closeSidebar();

    // Focus input
    setTimeout(() => messageInput.focus(), 350);
}

// ─────────────── MESSAGES ───────────────
function renderMessages() {
    const msgs = chatHistory[activeContactId] || [];
    const contact = CONTACTS.find(c => c.id === activeContactId);

    let html = '';

    // Date separator
    html += `<div class="date-separator"><span>Today</span></div>`;

    msgs.forEach(msg => {
        const isSent = msg.from === 'me';
        html += `
            <div class="message-row ${isSent ? 'sent' : 'received'}">
                ${!isSent ? `<div class="avatar avatar-small ${contact.avatarClass}"><span>${contact.avatar}</span></div>` : ''}
                <div class="message-bubble">
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">
                        ${msg.time}
                        ${isSent ? '<span class="message-check">✓✓</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    messagesList.innerHTML = html;
    scrollToBottom();
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ─────────────── SEND MESSAGE ───────────────
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeContactId) return;

    const now = new Date();
    const time = formatTime(now);

    // Add to history
    if (!chatHistory[activeContactId]) chatHistory[activeContactId] = [];
    chatHistory[activeContactId].push({ from: 'me', text, time });
    saveChatHistory();

    // Append to DOM
    appendMessage('me', text, time);
    messageInput.value = '';
    autoResizeInput();
    updateSendButton();
    renderContacts(searchInput.value);

    // Trigger auto-reply
    triggerAutoReply();
}

function appendMessage(from, text, time) {
    const contact = CONTACTS.find(c => c.id === activeContactId);
    const isSent = from === 'me';

    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    let avatarHtml = '';
    if (!isSent && contact) {
        avatarHtml = `<div class="avatar avatar-small ${contact.avatarClass}"><span>${contact.avatar}</span></div>`;
    }

    row.innerHTML = `
        ${avatarHtml}
        <div class="message-bubble">
            <div class="message-text">${escapeHtml(text)}</div>
            <div class="message-time">
                ${time}
                ${isSent ? '<span class="message-check">✓✓</span>' : ''}
            </div>
        </div>
    `;

    messagesList.appendChild(row);
    scrollToBottom();
}

function formatTime(date) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

// ─────────────── AUTO-REPLY ───────────────
function triggerAutoReply() {
    const contactId = activeContactId;
    const contact = CONTACTS.find(c => c.id === contactId);
    if (!contact) return;

    // Show typing indicator after short delay
    setTimeout(() => {
        if (activeContactId !== contactId) return;
        showTypingIndicator();
    }, 600);

    // Send reply after typing
    const replyDelay = 1500 + Math.random() * 2000;
    setTimeout(() => {
        hideTypingIndicator();
        if (activeContactId !== contactId) return;

        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
        const time = formatTime(new Date());

        chatHistory[contactId].push({ from: 'them', text: reply, time });
        saveChatHistory();
        appendMessage('them', reply, time);
        renderContacts(searchInput.value);
    }, replyDelay);
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// ─────────────── EMOJI PICKER ───────────────
function buildEmojiPicker() {
    emojiGrid.innerHTML = EMOJIS.map(e =>
        `<div class="emoji-item" data-emoji="${e}">${e}</div>`
    ).join('');
}

function toggleEmojiPicker() {
    const isOpen = emojiPicker.style.display !== 'none';
    emojiPicker.style.display = isOpen ? 'none' : 'block';
    emojiBtn.classList.toggle('active', !isOpen);
}

function insertEmoji(emoji) {
    messageInput.value += emoji;
    messageInput.focus();
    autoResizeInput();
    updateSendButton();
}

// ─────────────── SIDEBAR ───────────────
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ─────────────── INPUT HANDLING ───────────────
function autoResizeInput() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    sendBtn.disabled = messageInput.value.trim().length === 0;
}

// ─────────────── EVENT BINDINGS ───────────────
function bindEvents() {
    // Sidebar
    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Contact selection
    contactsList.addEventListener('click', (e) => {
        const item = e.target.closest('.contact-item');
        if (item) {
            selectContact(item.dataset.id);
        }
    });

    // Search
    searchInput.addEventListener('input', () => {
        renderContacts(searchInput.value);
    });

    // Send message
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        autoResizeInput();
        updateSendButton();
    });

    // Emoji picker
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEmojiPicker();
    });

    emojiGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.emoji-item');
        if (item) {
            insertEmoji(item.dataset.emoji);
        }
    });

    // Close emoji picker on outside click
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
            emojiBtn.classList.remove('active');
        }
    });

    // Handle window resize — auto-show sidebar on desktop
    window.addEventListener('resize', handleResize);
    handleResize();
}

function handleResize() {
    if (window.innerWidth >= 1024) {
        // Desktop: sidebar always visible
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ─────────────── LAUNCH ───────────────
document.addEventListener('DOMContentLoaded', init);
