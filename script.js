/* ===================================================
   OPUS AI CHAT — JavaScript (v2)
   Puter.js AI Integration + Group Chat
   =================================================== */

// ─────────────── AI MODEL CONTACTS ───────────────
const AI_MODELS = [
    {
        id: 'gpt4o',
        name: 'GPT-4o',
        model: 'gpt-4o',
        avatar: 'G',
        avatarClass: 'avatar-gpt',
        vendor: 'OpenAI',
        description: 'Multimodal powerhouse',
    },
    {
        id: 'claude',
        name: 'Claude Sonnet',
        model: 'claude-sonnet-4-20250514',
        avatar: 'C',
        avatarClass: 'avatar-claude',
        vendor: 'Anthropic',
        description: 'Thoughtful & safe',
    },
    {
        id: 'gemini',
        name: 'Gemini Flash',
        model: 'gemini-2.5-flash-lite',
        avatar: 'G',
        avatarClass: 'avatar-gemini',
        vendor: 'Google',
        description: 'Fast & versatile',
    },
    {
        id: 'llama',
        name: 'LLaMA 4',
        model: 'meta-llama/llama-4-scout',
        avatar: 'L',
        avatarClass: 'avatar-llama',
        vendor: 'Meta',
        description: 'Open-source giant',
    },
    {
        id: 'deepseek',
        name: 'DeepSeek R1',
        model: 'deepseek-r1',
        avatar: 'D',
        avatarClass: 'avatar-deepseek',
        vendor: 'DeepSeek',
        description: 'Reasoning specialist',
    },
    {
        id: 'mistral',
        name: 'Mistral Large',
        model: 'mistral-large-latest',
        avatar: 'M',
        avatarClass: 'avatar-mistral',
        vendor: 'Mistral',
        description: 'European excellence',
    },
    {
        id: 'grok',
        name: 'Grok',
        model: 'grok-3-mini',
        avatar: 'X',
        avatarClass: 'avatar-grok',
        vendor: 'xAI',
        description: 'Witty & real-time',
    },
];

const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡',
    '👍', '👎', '👋', '🙌', '💪', '🙏', '❤️', '💔',
    '🔥', '⭐', '✨', '🎉', '🎊', '💯', '🚀', '💡',
    '☀️', '🌙', '🌈', '🍕', '🍔', '☕', '🎵', '📱',
    '💻', '🎮', '📚', '✅', '❌', '⚡', '💬', '😊',
];

// ─────────────── STATE ───────────────
let activeChat = null;       // { type: '1on1'|'group', id: string }
let chatHistories = {};      // id -> [{ from, text, time, senderName?, senderAvatar?, senderAvatarClass? }]
let groups = [];             // [{ id, name, members: [modelId, ...] }]
let isAiResponding = false;

// ─────────────── DOM REFS ───────────────
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const contactsList = document.getElementById('contactsList');
const groupsList = document.getElementById('groupsList');
const groupLabel = document.getElementById('groupLabel');
const newGroupBtn = document.getElementById('newGroupBtn');

const headerAvatar = document.getElementById('headerAvatar');
const headerAvatarLetter = document.getElementById('headerAvatarLetter');
const headerName = document.getElementById('headerName');
const headerStatus = document.getElementById('headerStatus');
const clearChatBtn = document.getElementById('clearChatBtn');

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
const typingAvatarWrap = document.getElementById('typingAvatarWrap');
const typingName = document.getElementById('typingName');

// Modal
const groupModal = document.getElementById('groupModal');
const modalClose = document.getElementById('modalClose');
const groupNameInput = document.getElementById('groupNameInput');
const modelSelectGrid = document.getElementById('modelSelectGrid');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalCreateBtn = document.getElementById('modalCreateBtn');

// ─────────────── INIT ───────────────
function init() {
    loadState();
    renderContacts();
    renderGroups();
    buildEmojiPicker();
    buildModelSelectGrid();
    bindEvents();

    // Auto-select first AI model
    if (AI_MODELS.length > 0) {
        selectChat('1on1', AI_MODELS[0].id);
    }
}

// ─────────────── PERSISTENCE ───────────────
function loadState() {
    try {
        const saved = localStorage.getItem('opus_ai_chat_v2');
        if (saved) {
            const data = JSON.parse(saved);
            chatHistories = data.chatHistories || {};
            groups = data.groups || [];
        }
    } catch (e) { /* ignore */ }
}

function saveState() {
    try {
        localStorage.setItem('opus_ai_chat_v2', JSON.stringify({ chatHistories, groups }));
    } catch (e) { /* ignore */ }
}

// ─────────────── RENDER CONTACTS ───────────────
function renderContacts() {
    contactsList.innerHTML = AI_MODELS.map((m, i) => {
        const msgs = chatHistories[m.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === '1on1' && activeChat.id === m.id;

        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="1on1" data-id="${m.id}"
                 style="animation-delay: ${i * 0.04}s">
                <div class="avatar ${m.avatarClass}">
                    <span>${m.avatar}</span>
                    <div class="online-dot"></div>
                </div>
                <div class="contact-details">
                    <div class="contact-top-row">
                        <span class="contact-name">${m.name}</span>
                        <span class="contact-time">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="contact-bottom-row">
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 30) : m.description}</span>
                        <span class="model-badge">${m.vendor}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGroups() {
    if (groups.length === 0) {
        groupLabel.style.display = 'none';
        groupsList.innerHTML = '';
        return;
    }

    groupLabel.style.display = '';
    groupsList.innerHTML = groups.map((g, i) => {
        const msgs = chatHistories[g.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === 'group' && activeChat.id === g.id;
        const memberCount = g.members.length;

        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="group" data-id="${g.id}"
                 style="animation-delay: ${i * 0.04}s">
                <div class="avatar avatar-group">
                    <span>👥</span>
                </div>
                <div class="contact-details">
                    <div class="contact-top-row">
                        <span class="contact-name">${g.name}</span>
                        <span class="contact-time">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="contact-bottom-row">
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 25) : `${memberCount} AI models`}</span>
                        <span class="model-badge">Group</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function truncate(str, len) {
    return str.length > len ? str.substring(0, len) + '…' : str;
}

// ─────────────── SELECT CHAT ───────────────
function selectChat(type, id) {
    activeChat = { type, id };

    if (type === '1on1') {
        const model = AI_MODELS.find(m => m.id === id);
        if (!model) return;
        headerAvatarLetter.textContent = model.avatar;
        headerAvatar.className = `avatar avatar-header ${model.avatarClass}`;
        headerName.textContent = model.name;
        headerStatus.textContent = `${model.vendor} · Ready`;
    } else {
        const group = groups.find(g => g.id === id);
        if (!group) return;
        headerAvatarLetter.textContent = '👥';
        headerAvatar.className = 'avatar avatar-header avatar-group';
        headerName.textContent = group.name;
        const names = group.members.map(mid => {
            const m = AI_MODELS.find(a => a.id === mid);
            return m ? m.name : mid;
        });
        headerStatus.textContent = names.join(', ');
    }

    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = '';
    messageInputBar.style.display = '';

    renderMessages();
    renderContacts();
    renderGroups();
    closeSidebar();

    setTimeout(() => messageInput.focus(), 350);
}

// ─────────────── RENDER MESSAGES ───────────────
function renderMessages() {
    if (!activeChat) return;
    const msgs = chatHistories[activeChat.id] || [];
    const isGroup = activeChat.type === 'group';

    let html = '<div class="date-separator"><span>Today</span></div>';

    msgs.forEach(msg => {
        const isSent = msg.from === 'me';
        let avatarHtml = '';
        let senderHtml = '';

        if (!isSent) {
            const cls = msg.senderAvatarClass || 'avatar-gpt';
            const letter = msg.senderAvatar || 'A';
            avatarHtml = `<div class="avatar avatar-small ${cls}"><span>${letter}</span></div>`;

            if (isGroup && msg.senderName) {
                senderHtml = `<span class="msg-sender-name" style="color: var(--primary)">${msg.senderName}</span>`;
            }
        }

        html += `
            <div class="message-row ${isSent ? 'sent' : 'received'}">
                ${avatarHtml}
                <div class="message-bubble">
                    ${senderHtml}
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

function formatTime(date) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

// ─────────────── SEND MESSAGE ───────────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChat || isAiResponding) return;

    const now = new Date();
    const time = formatTime(now);

    if (!chatHistories[activeChat.id]) chatHistories[activeChat.id] = [];
    chatHistories[activeChat.id].push({ from: 'me', text, time });
    saveState();

    appendMessage('me', text, time);
    messageInput.value = '';
    autoResizeInput();
    updateSendButton();
    renderContacts();
    renderGroups();

    // Trigger AI response
    if (activeChat.type === '1on1') {
        await triggerAiReply(activeChat.id);
    } else {
        await triggerGroupReply(activeChat.id);
    }
}

function appendMessage(from, text, time, senderName, senderAvatar, senderAvatarClass) {
    const isSent = from === 'me';
    const isGroup = activeChat && activeChat.type === 'group';

    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    let avatarHtml = '';
    let senderHtml = '';

    if (!isSent) {
        const cls = senderAvatarClass || 'avatar-gpt';
        const letter = senderAvatar || 'A';
        avatarHtml = `<div class="avatar avatar-small ${cls}"><span>${letter}</span></div>`;

        if (isGroup && senderName) {
            senderHtml = `<span class="msg-sender-name" style="color: var(--primary)">${senderName}</span>`;
        }
    }

    row.innerHTML = `
        ${avatarHtml}
        <div class="message-bubble">
            ${senderHtml}
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

// ─────────────── 1:1 AI REPLY ───────────────
async function triggerAiReply(modelId) {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model) return;

    isAiResponding = true;
    showTypingIndicator(model);

    try {
        // Build message history for context
        const history = (chatHistories[modelId] || []).slice(-20);
        const messages = [
            { role: 'system', content: `You are ${model.name} by ${model.vendor}. Keep responses concise (2-3 sentences max). Be helpful, friendly, and conversational.` },
            ...history.map(msg => ({
                role: msg.from === 'me' ? 'user' : 'assistant',
                content: msg.text
            }))
        ];

        const response = await puter.ai.chat(messages, { model: model.model });

        hideTypingIndicator();

        const replyText = typeof response === 'string'
            ? response
            : (response?.message?.content || response?.text || String(response));

        const time = formatTime(new Date());

        chatHistories[modelId].push({
            from: 'ai',
            text: replyText,
            time,
            senderName: model.name,
            senderAvatar: model.avatar,
            senderAvatarClass: model.avatarClass,
        });
        saveState();

        if (activeChat && activeChat.id === modelId) {
            appendMessage('ai', replyText, time, model.name, model.avatar, model.avatarClass);
        }
        renderContacts();

    } catch (err) {
        hideTypingIndicator();
        const time = formatTime(new Date());
        const errorText = `⚠️ Error: ${err.message || 'Failed to get response. Please try again.'}`;

        chatHistories[modelId].push({
            from: 'ai', text: errorText, time,
            senderName: model.name, senderAvatar: model.avatar, senderAvatarClass: model.avatarClass,
        });
        saveState();

        if (activeChat && activeChat.id === modelId) {
            appendMessage('ai', errorText, time, model.name, model.avatar, model.avatarClass);
        }
    }

    isAiResponding = false;
}

// ─────────────── GROUP CHAT REPLY ───────────────
async function triggerGroupReply(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    isAiResponding = true;

    // Each AI model in the group responds one by one
    for (const memberId of group.members) {
        const model = AI_MODELS.find(m => m.id === memberId);
        if (!model) continue;

        showTypingIndicator(model);

        // Small delay between different AI responses to feel natural
        await sleep(500);

        try {
            // Build context: include ALL group messages so each AI sees what others said
            const history = (chatHistories[groupId] || []).slice(-30);
            const messages = [
                {
                    role: 'system',
                    content: `You are ${model.name} by ${model.vendor} in a group chat with the user and other AI models: ${group.members.map(mid => {
                        const mm = AI_MODELS.find(a => a.id === mid);
                        return mm ? mm.name : mid;
                    }).join(', ')}. You can see everyone's messages and can respond to other AIs or the user. Keep responses concise (2-3 sentences). Be conversational and engage with what others have said.`
                },
                ...history.map(msg => {
                    if (msg.from === 'me') {
                        return { role: 'user', content: msg.text };
                    } else {
                        // Other AI messages shown as assistant context
                        return { role: msg.senderName === model.name ? 'assistant' : 'user', content: `[${msg.senderName}]: ${msg.text}` };
                    }
                })
            ];

            const response = await puter.ai.chat(messages, { model: model.model });

            hideTypingIndicator();

            const replyText = typeof response === 'string'
                ? response
                : (response?.message?.content || response?.text || String(response));

            const time = formatTime(new Date());

            if (!chatHistories[groupId]) chatHistories[groupId] = [];
            chatHistories[groupId].push({
                from: 'ai',
                text: replyText,
                time,
                senderName: model.name,
                senderAvatar: model.avatar,
                senderAvatarClass: model.avatarClass,
            });
            saveState();

            if (activeChat && activeChat.type === 'group' && activeChat.id === groupId) {
                appendMessage('ai', replyText, time, model.name, model.avatar, model.avatarClass);
            }
            renderGroups();

        } catch (err) {
            hideTypingIndicator();
            const time = formatTime(new Date());
            const errorText = `⚠️ ${model.name} error: ${err.message || 'Failed to respond'}`;

            if (!chatHistories[groupId]) chatHistories[groupId] = [];
            chatHistories[groupId].push({
                from: 'ai', text: errorText, time,
                senderName: model.name, senderAvatar: model.avatar, senderAvatarClass: model.avatarClass,
            });
            saveState();

            if (activeChat && activeChat.type === 'group' && activeChat.id === groupId) {
                appendMessage('ai', errorText, time, model.name, model.avatar, model.avatarClass);
            }
        }
    }

    isAiResponding = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────── TYPING INDICATOR ───────────────
function showTypingIndicator(model) {
    typingAvatar.textContent = model.avatar;
    typingAvatarWrap.className = `avatar avatar-small ${model.avatarClass}`;
    typingName.textContent = model.name;
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// ─────────────── GROUP MODAL ───────────────
let selectedModelIds = new Set();

function buildModelSelectGrid() {
    modelSelectGrid.innerHTML = AI_MODELS.map(m => `
        <div class="model-select-item" data-id="${m.id}">
            <div class="avatar ${m.avatarClass}">
                <span>${m.avatar}</span>
            </div>
            <span class="model-select-name">${m.name}</span>
            <div class="model-select-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        </div>
    `).join('');
}

function openGroupModal() {
    selectedModelIds.clear();
    groupNameInput.value = '';
    updateModelSelection();
    groupModal.style.display = 'flex';
}

function closeGroupModal() {
    groupModal.style.display = 'none';
}

function toggleModelSelection(modelId) {
    if (selectedModelIds.has(modelId)) {
        selectedModelIds.delete(modelId);
    } else {
        selectedModelIds.add(modelId);
    }
    updateModelSelection();
}

function updateModelSelection() {
    modelSelectGrid.querySelectorAll('.model-select-item').forEach(el => {
        const id = el.dataset.id;
        el.classList.toggle('selected', selectedModelIds.has(id));
    });
}

function createGroup() {
    const name = groupNameInput.value.trim() || 'AI Group Chat';
    if (selectedModelIds.size < 2) {
        groupNameInput.placeholder = 'Select at least 2 models!';
        groupNameInput.classList.add('error');
        setTimeout(() => groupNameInput.classList.remove('error'), 1500);
        return;
    }

    const group = {
        id: 'group_' + Date.now(),
        name,
        members: [...selectedModelIds],
    };

    groups.push(group);
    saveState();
    closeGroupModal();
    renderGroups();
    selectChat('group', group.id);
}

// ─────────────── CLEAR CHAT ───────────────
function clearCurrentChat() {
    if (!activeChat) return;
    chatHistories[activeChat.id] = [];
    saveState();
    renderMessages();
    renderContacts();
    renderGroups();
}

// ─────────────── EMOJI ───────────────
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
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
}

// ─────────────── INPUT ───────────────
function autoResizeInput() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    sendBtn.disabled = messageInput.value.trim().length === 0 || isAiResponding;
}

// ─────────────── EVENT BINDINGS ───────────────
function bindEvents() {
    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Contact & Group selection
    contactsList.addEventListener('click', (e) => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });

    groupsList.addEventListener('click', (e) => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });

    // Send
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

    // Emoji
    emojiBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleEmojiPicker(); });
    emojiGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.emoji-item');
        if (item) insertEmoji(item.dataset.emoji);
    });
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
            emojiBtn.classList.remove('active');
        }
    });

    // Clear chat
    clearChatBtn.addEventListener('click', clearCurrentChat);

    // Group modal
    newGroupBtn.addEventListener('click', openGroupModal);
    modalClose.addEventListener('click', closeGroupModal);
    modalCancelBtn.addEventListener('click', closeGroupModal);
    modalCreateBtn.addEventListener('click', createGroup);

    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) closeGroupModal();
    });

    modelSelectGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.model-select-item');
        if (item) toggleModelSelection(item.dataset.id);
    });

    // Resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    });
}

// ─────────────── LAUNCH ───────────────
document.addEventListener('DOMContentLoaded', init);
