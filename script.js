/* ===================================================
   OPUS AI CHAT v2 — JavaScript
   Puter.js · Dynamic Model List · Group Chat · Endless Chat
   =================================================== */

// ─────────────── FEATURED AI MODELS (sidebar contacts) ───────────────
const FEATURED_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', avatar: 'G', avatarClass: 'avatar-gpt', vendor: 'OpenAI', desc: 'Multimodal powerhouse' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', avatar: 'C', avatarClass: 'avatar-claude', vendor: 'Anthropic', desc: 'Thoughtful & safe' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', avatar: 'G', avatarClass: 'avatar-gemini', vendor: 'Google', desc: 'Fast & versatile' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', avatar: 'D', avatarClass: 'avatar-deepseek', vendor: 'DeepSeek', desc: 'Reasoning specialist' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', avatar: 'X', avatarClass: 'avatar-grok', vendor: 'xAI', desc: 'Witty & real-time' },
    { id: 'mistral-large-latest', name: 'Mistral Large', avatar: 'M', avatarClass: 'avatar-mistral', vendor: 'Mistral', desc: 'European excellence' },
    { id: 'meta-llama/llama-4-scout', name: 'LLaMA 4 Scout', avatar: 'L', avatarClass: 'avatar-llama', vendor: 'Meta', desc: 'Open-source giant' },
];

const EMOJIS = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡',
    '👍', '👎', '👋', '🙌', '💪', '🙏', '❤️', '💔',
    '🔥', '⭐', '✨', '🎉', '🎊', '💯', '🚀', '💡',
    '☀️', '🌙', '🌈', '🍕', '🍔', '☕', '🎵', '📱',
    '💻', '🎮', '📚', '✅', '❌', '⚡', '💬', '😊',
];

// ─────────────── STATE ───────────────
let allModels = [];          // from puter.ai.listModels()
let activeChat = null;       // { type: '1on1'|'group'|'endless'|'custom', id }
let chatHistories = {};
let groups = [];             // [{ id, name, members: [modelId, ...] }]
let endlessChats = [];       // [{ id, name, members: [modelId, modelId] }]
let customContacts = [];     // [modelId, ...] — user-added 1:1 chats
let isAiResponding = false;
let endlessRunning = false;
let endlessAbortFlag = false;
let selectedModelIds = new Set();
let modalMode = 'group';     // 'group', 'endless', or 'custom1on1'

// ─────────────── DOM ───────────────
const $ = id => document.getElementById(id);

const sidebar = $('sidebar');
const sidebarOverlay = $('sidebarOverlay');
const sidebarClose = $('sidebarClose');
const hamburgerBtn = $('hamburgerBtn');
const contactsList = $('contactsList');
const groupsList = $('groupsList');
const groupLabel = $('groupLabel');
const endlessList = $('endlessList');
const endlessLabel = $('endlessLabel');
const customList = $('customList');
const customLabel = $('customLabel');
const newGroupBtn = $('newGroupBtn');
const newEndlessBtn = $('newEndlessBtn');
const newCustomBtn = $('newCustomBtn');
const deleteChatBtn = $('deleteChatBtn');

const headerAvatar = $('headerAvatar');
const headerAvatarLetter = $('headerAvatarLetter');
const headerName = $('headerName');
const headerStatus = $('headerStatus');
const clearChatBtn = $('clearChatBtn');

const welcomeScreen = $('welcomeScreen');
const messagesContainer = $('messagesContainer');
const messagesList = $('messagesList');
const messageInputBar = $('messageInputBar');
const messageInput = $('messageInput');
const sendBtn = $('sendBtn');
const stopBtn = $('stopBtn');
const emojiBtn = $('emojiBtn');
const emojiPicker = $('emojiPicker');
const emojiGrid = $('emojiGrid');
const typingIndicator = $('typingIndicator');
const typingAvatar = $('typingAvatar');
const typingAvatarWrap = $('typingAvatarWrap');
const typingName = $('typingName');

const groupModal = $('groupModal');
const modalTitle = $('modalTitle');
const nameLabel = $('nameLabel');
const modalClose = $('modalClose');
const groupNameInput = $('groupNameInput');
const modelSearchInput = $('modelSearchInput');
const modelSelectGrid = $('modelSelectGrid');
const modelLoading = $('modelLoading');
const selectionCount = $('selectionCount');
const modalCancelBtn = $('modalCancelBtn');
const modalCreateBtn = $('modalCreateBtn');

// ─────────────── INIT ───────────────
async function init() {
    loadState();
    renderContacts();
    renderGroups();
    renderEndlessChats();
    renderCustomChats();
    buildEmojiPicker();
    bindEvents();

    if (FEATURED_MODELS.length > 0) {
        selectChat('1on1', FEATURED_MODELS[0].id);
    }

    // Load all models in background
    loadAllModels();
}

// ─────────────── LOAD ALL MODELS ───────────────
async function loadAllModels() {
    try {
        const models = await puter.ai.listModels();
        allModels = models.map(m => ({
            id: m.id,
            puterId: m.puterId || '',
            vendor: extractVendor(m.puterId || m.id),
        }));
        allModels.sort((a, b) => a.id.localeCompare(b.id));
    } catch (e) {
        console.warn('Failed to load models:', e);
        // Fallback to featured models
        allModels = FEATURED_MODELS.map(m => ({ id: m.id, puterId: '', vendor: m.vendor }));
    }
}

function extractVendor(puterId) {
    if (!puterId) return '';
    // Format: "vendor:vendor/model" or just "model-name"
    const parts = puterId.split(':');
    if (parts.length >= 2) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return '';
}

// ─────────────── RESPONSE TEXT EXTRACTION (BUG FIX) ───────────────
function extractResponseText(response) {
    // String response
    if (typeof response === 'string') return response;

    // ChatResponse with message.content
    if (response && response.message) {
        const content = response.message.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            return content.map(part => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                if (part && typeof part.content === 'string') return part.content;
                return '';
            }).join('');
        }
        if (content !== null && content !== undefined) return String(content);
    }

    // .text property
    if (response && typeof response.text === 'string') return response.text;

    // toString fallback
    try {
        const str = String(response);
        if (str && str !== '[object Object]') return str;
    } catch (e) { }

    return 'Unable to parse response';
}

// ─────────────── PERSISTENCE ───────────────
function loadState() {
    try {
        const saved = localStorage.getItem('opus_ai_chat_v2');
        if (saved) {
            const data = JSON.parse(saved);
            chatHistories = data.chatHistories || {};
            groups = data.groups || [];
            endlessChats = data.endlessChats || [];
            customContacts = data.customContacts || [];
        }
    } catch (e) { }
}

function saveState() {
    try {
        localStorage.setItem('opus_ai_chat_v2', JSON.stringify({ chatHistories, groups, endlessChats, customContacts }));
    } catch (e) { }
}

// ─────────────── RENDER SIDEBAR ───────────────
function renderContacts() {
    contactsList.innerHTML = FEATURED_MODELS.map((m, i) => {
        const msgs = chatHistories[m.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === '1on1' && activeChat.id === m.id;

        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="1on1" data-id="${m.id}"
                 style="animation-delay:${i * 0.04}s">
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
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 28) : m.desc}</span>
                        <span class="model-badge">${m.vendor}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function renderGroups() {
    if (groups.length === 0) { groupLabel.style.display = 'none'; groupsList.innerHTML = ''; return; }
    groupLabel.style.display = '';
    groupsList.innerHTML = groups.map((g, i) => {
        const msgs = chatHistories[g.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === 'group' && activeChat.id === g.id;
        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="group" data-id="${g.id}"
                 style="animation-delay:${i * 0.04}s">
                <div class="avatar avatar-group"><span>👥</span></div>
                <div class="contact-details">
                    <div class="contact-top-row">
                        <span class="contact-name">${g.name}</span>
                        <span class="contact-time">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="contact-bottom-row">
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 25) : g.members.length + ' AI models'}</span>
                        <span class="model-badge">Group</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function renderEndlessChats() {
    if (endlessChats.length === 0) { endlessLabel.style.display = 'none'; endlessList.innerHTML = ''; return; }
    endlessLabel.style.display = '';
    endlessList.innerHTML = endlessChats.map((e, i) => {
        const msgs = chatHistories[e.id] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === 'endless' && activeChat.id === e.id;
        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="endless" data-id="${e.id}"
                 style="animation-delay:${i * 0.04}s">
                <div class="avatar avatar-endless"><span>∞</span></div>
                <div class="contact-details">
                    <div class="contact-top-row">
                        <span class="contact-name">${e.name}</span>
                        <span class="contact-time">${lastMsg ? lastMsg.time : ''}</span>
                    </div>
                    <div class="contact-bottom-row">
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 25) : 'Endless debate'}</span>
                        <span class="model-badge badge-endless">∞ Endless</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function renderCustomChats() {
    if (customContacts.length === 0) { customLabel.style.display = 'none'; customList.innerHTML = ''; return; }
    customLabel.style.display = '';
    customList.innerHTML = customContacts.map((modelId, i) => {
        const m = getModelInfo(modelId);
        const msgs = chatHistories['custom_' + modelId] || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const isActive = activeChat && activeChat.type === 'custom' && activeChat.id === modelId;
        return `
            <div class="contact-item${isActive ? ' active' : ''}"
                 data-type="custom" data-id="${modelId}"
                 style="animation-delay:${i * 0.04}s">
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
                        <span class="contact-last-msg">${lastMsg ? truncate(lastMsg.text, 28) : m.id}</span>
                        <span class="model-badge">${m.vendor || 'Custom'}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function truncate(str, len) { return str.length > len ? str.substring(0, len) + '…' : str; }

// ─────────────── GET MODEL INFO ───────────────
function getModelInfo(modelId) {
    const featured = FEATURED_MODELS.find(m => m.id === modelId);
    if (featured) return featured;
    // Dynamic model — generate info
    const initial = modelId.charAt(0).toUpperCase();
    return {
        id: modelId,
        name: modelId,
        avatar: initial,
        avatarClass: 'avatar-default',
        vendor: extractVendor(modelId),
        desc: modelId,
    };
}

// ─────────────── SELECT CHAT ───────────────
function selectChat(type, id) {
    // If switching away from an endless chat that's running, stop it
    if (endlessRunning && !(type === 'endless' && activeChat && activeChat.id === id)) {
        endlessAbortFlag = true;
    }

    activeChat = { type, id };

    if (type === '1on1' || type === 'custom') {
        const m = getModelInfo(id);
        headerAvatarLetter.textContent = m.avatar;
        headerAvatar.className = `avatar avatar-header ${m.avatarClass}`;
        headerName.textContent = m.name;
        headerStatus.textContent = `${m.vendor || 'AI'} · Ready`;
    } else if (type === 'group') {
        const group = groups.find(g => g.id === id);
        if (!group) return;
        headerAvatarLetter.textContent = '👥';
        headerAvatar.className = 'avatar avatar-header avatar-group';
        headerName.textContent = group.name;
        headerStatus.textContent = group.members.map(mid => getModelInfo(mid).name).join(', ');
    } else if (type === 'endless') {
        const ec = endlessChats.find(e => e.id === id);
        if (!ec) return;
        headerAvatarLetter.textContent = '∞';
        headerAvatar.className = 'avatar avatar-header avatar-endless';
        headerName.textContent = ec.name;
        headerStatus.textContent = ec.members.map(mid => getModelInfo(mid).name).join(' vs ');
    }

    // Show/hide delete button (only for groups, endless, custom — not featured 1:1)
    deleteChatBtn.style.display = (type === 'group' || type === 'endless' || type === 'custom') ? '' : 'none';

    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = '';
    messageInputBar.style.display = '';

    // Update input bar state
    if (type === 'endless' && endlessRunning && activeChat.id === id) {
        showStopMode();
    } else {
        showNormalMode();
    }

    renderMessages();
    renderContacts();
    renderGroups();
    renderEndlessChats();
    renderCustomChats();
    closeSidebar();
    setTimeout(() => messageInput.focus(), 350);
}

// ─────────────── INPUT BAR MODES ───────────────
function showStopMode() {
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    messageInput.placeholder = 'AIs are chatting… click stop to intervene';
    messageInput.disabled = true;
}

function showNormalMode() {
    stopBtn.style.display = 'none';
    sendBtn.style.display = 'flex';
    messageInput.placeholder = 'Type a message…';
    messageInput.disabled = false;
    updateSendButton();
}

// ─────────────── RENDER MESSAGES ───────────────
function renderMessages() {
    if (!activeChat) return;
    // Custom chats use 'custom_' prefix in chatHistories
    const chatKey = activeChat.type === 'custom' ? 'custom_' + activeChat.id : activeChat.id;
    const msgs = chatHistories[chatKey] || [];
    const isGroupLike = activeChat.type === 'group' || activeChat.type === 'endless';

    let html = '<div class="date-separator"><span>Today</span></div>';

    msgs.forEach(msg => {
        const isSent = msg.from === 'me';
        let avatarHtml = '';
        let senderHtml = '';

        if (!isSent) {
            const cls = msg.senderAvatarClass || 'avatar-default';
            const letter = msg.senderAvatar || '?';
            avatarHtml = `<div class="avatar avatar-small ${cls}"><span>${letter}</span></div>`;
            if (isGroupLike && msg.senderName) {
                senderHtml = `<span class="msg-sender-name" style="color:var(--primary)">${escapeHtml(msg.senderName)}</span>`;
            }
        }

        html += `
            <div class="message-row ${isSent ? 'sent' : 'received'}">
                ${avatarHtml}
                <div class="message-bubble">
                    ${senderHtml}
                    <div class="message-text">${escapeHtml(String(msg.text || ''))}</div>
                    <div class="message-time">
                        ${msg.time}
                        ${isSent ? '<span class="message-check">✓✓</span>' : ''}
                    </div>
                </div>
            </div>`;
    });

    messagesList.innerHTML = html;
    scrollToBottom();
}

function scrollToBottom() {
    requestAnimationFrame(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; });
}

function escapeHtml(text) {
    if (typeof text !== 'string') text = String(text || '');
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

function appendMessage(from, text, time, senderName, senderAvatar, senderAvatarClass) {
    const isSent = from === 'me';
    const isGroupLike = activeChat && (activeChat.type === 'group' || activeChat.type === 'endless');

    const row = document.createElement('div');
    row.className = `message-row ${isSent ? 'sent' : 'received'}`;

    let avatarHtml = '';
    let senderHtml = '';
    if (!isSent) {
        const cls = senderAvatarClass || 'avatar-default';
        const letter = senderAvatar || '?';
        avatarHtml = `<div class="avatar avatar-small ${cls}"><span>${letter}</span></div>`;
        if (isGroupLike && senderName) {
            senderHtml = `<span class="msg-sender-name" style="color:var(--primary)">${escapeHtml(senderName)}</span>`;
        }
    }

    row.innerHTML = `
        ${avatarHtml}
        <div class="message-bubble">
            ${senderHtml}
            <div class="message-text">${escapeHtml(String(text || ''))}</div>
            <div class="message-time">
                ${time}
                ${isSent ? '<span class="message-check">✓✓</span>' : ''}
            </div>
        </div>`;

    messagesList.appendChild(row);
    scrollToBottom();
}

// ─────────────── SEND MESSAGE ───────────────
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChat || isAiResponding) return;

    const chatKey = activeChat.type === 'custom' ? 'custom_' + activeChat.id : activeChat.id;
    const time = formatTime(new Date());
    if (!chatHistories[chatKey]) chatHistories[chatKey] = [];
    chatHistories[chatKey].push({ from: 'me', text, time });
    saveState();
    appendMessage('me', text, time);
    messageInput.value = '';
    autoResizeInput();
    updateSendButton();
    renderContacts(); renderGroups(); renderEndlessChats(); renderCustomChats();

    if (activeChat.type === '1on1' || activeChat.type === 'custom') {
        await triggerAiReply(chatKey, activeChat.id);
    } else if (activeChat.type === 'group') {
        await triggerGroupReply(activeChat.id);
    } else if (activeChat.type === 'endless') {
        startEndless(activeChat.id);
    }
}

// ─────────────── 1:1 AI REPLY ───────────────
async function triggerAiReply(chatKey, modelId) {
    const model = getModelInfo(modelId);
    isAiResponding = true;
    updateSendButton();
    showTypingIndicator(model);

    try {
        const history = (chatHistories[chatKey] || []).slice(-20);
        const messages = [
            { role: 'system', content: `You are ${model.name}. Keep responses concise (2-3 sentences). Be helpful, friendly, conversational.` },
            ...history.map(msg => ({
                role: msg.from === 'me' ? 'user' : 'assistant',
                content: String(msg.text || '')
            }))
        ];

        const response = await puter.ai.chat(messages, { model: model.id });
        hideTypingIndicator();

        const replyText = extractResponseText(response);
        const time = formatTime(new Date());

        if (!chatHistories[chatKey]) chatHistories[chatKey] = [];
        chatHistories[chatKey].push({
            from: 'ai', text: replyText, time,
            senderName: model.name, senderAvatar: model.avatar, senderAvatarClass: model.avatarClass,
        });
        saveState();

        const currentKey = activeChat ? (activeChat.type === 'custom' ? 'custom_' + activeChat.id : activeChat.id) : null;
        if (currentKey === chatKey) {
            appendMessage('ai', replyText, time, model.name, model.avatar, model.avatarClass);
        }
        renderContacts(); renderCustomChats();
    } catch (err) {
        hideTypingIndicator();
        handleAiError(chatKey, model, err);
    }

    isAiResponding = false;
    updateSendButton();
}

// ─────────────── GROUP REPLY ───────────────
async function triggerGroupReply(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    isAiResponding = true;
    updateSendButton();

    for (const memberId of group.members) {
        const model = getModelInfo(memberId);
        showTypingIndicator(model);
        await sleep(500);

        try {
            const history = (chatHistories[groupId] || []).slice(-30);
            const messages = buildGroupMessages(history, model, group.members);
            const response = await puter.ai.chat(messages, { model: model.id });
            hideTypingIndicator();

            const replyText = extractResponseText(response);
            const time = formatTime(new Date());

            if (!chatHistories[groupId]) chatHistories[groupId] = [];
            chatHistories[groupId].push({
                from: 'ai', text: replyText, time,
                senderName: model.name, senderAvatar: model.avatar, senderAvatarClass: model.avatarClass,
            });
            saveState();

            if (activeChat && activeChat.type === 'group' && activeChat.id === groupId) {
                appendMessage('ai', replyText, time, model.name, model.avatar, model.avatarClass);
            }
            renderGroups();
        } catch (err) {
            hideTypingIndicator();
            handleAiError(groupId, model, err);
        }
    }

    isAiResponding = false;
    updateSendButton();
}

function buildGroupMessages(history, currentModel, memberIds) {
    const allNames = memberIds.map(mid => getModelInfo(mid).name).join(', ');
    return [
        {
            role: 'system',
            content: `You are ${currentModel.name} in a group chat with the user and other AI models: ${allNames}. You can see everyone's messages. Engage with what others said. Keep responses concise (2-3 sentences).`
        },
        ...history.map(msg => {
            if (msg.from === 'me') return { role: 'user', content: String(msg.text || '') };
            const isMe = msg.senderName === currentModel.name;
            return { role: isMe ? 'assistant' : 'user', content: `[${msg.senderName}]: ${String(msg.text || '')}` };
        })
    ];
}

// ─────────────── ENDLESS CHAT ───────────────
async function startEndless(chatId) {
    const ec = endlessChats.find(e => e.id === chatId);
    if (!ec || ec.members.length < 2) return;

    endlessRunning = true;
    endlessAbortFlag = false;
    isAiResponding = true;
    showStopMode();
    updateSendButton();

    const model1 = getModelInfo(ec.members[0]);
    const model2 = getModelInfo(ec.members[1]);
    let current = model1;
    let next = model2;

    while (!endlessAbortFlag) {
        showTypingIndicator(current);
        await sleep(800);

        if (endlessAbortFlag) break;

        try {
            const history = (chatHistories[chatId] || []).slice(-30);
            const messages = [
                {
                    role: 'system',
                    content: `You are ${current.name} having an open-ended conversation with ${next.name}. The user started this conversation and you both should keep it going naturally. Respond to what was last said. Be engaging. Keep each response to 2-4 sentences. Don't repeat yourself. Explore new angles of the topic.`
                },
                ...history.map(msg => {
                    if (msg.from === 'me') return { role: 'user', content: String(msg.text || '') };
                    const isMe = msg.senderName === current.name;
                    return { role: isMe ? 'assistant' : 'user', content: `[${msg.senderName}]: ${String(msg.text || '')}` };
                })
            ];

            const response = await puter.ai.chat(messages, { model: current.id });
            hideTypingIndicator();

            if (endlessAbortFlag) break;

            const replyText = extractResponseText(response);
            const time = formatTime(new Date());

            if (!chatHistories[chatId]) chatHistories[chatId] = [];
            chatHistories[chatId].push({
                from: 'ai', text: replyText, time,
                senderName: current.name, senderAvatar: current.avatar, senderAvatarClass: current.avatarClass,
            });
            saveState();

            if (activeChat && activeChat.type === 'endless' && activeChat.id === chatId) {
                appendMessage('ai', replyText, time, current.name, current.avatar, current.avatarClass);
            }
            renderEndlessChats();

        } catch (err) {
            hideTypingIndicator();
            handleAiError(chatId, current, err);
            await sleep(2000);  // Wait before retrying after error
        }

        // Swap
        [current, next] = [next, current];

        // Small pause between turns
        await sleep(1500);
    }

    endlessRunning = false;
    isAiResponding = false;
    hideTypingIndicator();

    if (activeChat && activeChat.type === 'endless' && activeChat.id === chatId) {
        showNormalMode();
    }
    updateSendButton();
}

function stopEndless() {
    endlessAbortFlag = true;
}

// ─────────────── ERROR HANDLER ───────────────
function handleAiError(chatId, model, err) {
    const time = formatTime(new Date());
    const errorText = `⚠️ ${model.name} error: ${err.message || 'Failed to respond'}`;
    if (!chatHistories[chatId]) chatHistories[chatId] = [];
    chatHistories[chatId].push({
        from: 'ai', text: errorText, time,
        senderName: model.name, senderAvatar: model.avatar, senderAvatarClass: model.avatarClass,
    });
    saveState();
    if (activeChat && activeChat.id === chatId) {
        appendMessage('ai', errorText, time, model.name, model.avatar, model.avatarClass);
    }
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

// ─────────────── MODAL ───────────────
function openModal(mode) {
    modalMode = mode;
    selectedModelIds.clear();

    if (mode === 'group') {
        modalTitle.textContent = 'Create AI Group Chat';
        nameLabel.textContent = 'Group Name';
        groupNameInput.placeholder = 'e.g. AI Think Tank';
        modalCreateBtn.textContent = 'Create Group';
        nameLabel.style.display = '';
        groupNameInput.style.display = '';
    } else if (mode === 'endless') {
        modalTitle.textContent = 'Create Endless Chat';
        nameLabel.textContent = 'Chat Name';
        groupNameInput.placeholder = 'e.g. GPT vs Claude';
        modalCreateBtn.textContent = 'Create Endless Chat';
        nameLabel.style.display = '';
        groupNameInput.style.display = '';
    } else if (mode === 'custom1on1') {
        modalTitle.textContent = 'New AI Chat';
        nameLabel.style.display = 'none';
        groupNameInput.style.display = 'none';
        modalCreateBtn.textContent = 'Start Chat';
    }

    groupNameInput.value = '';
    modelSearchInput.value = '';
    renderModelList('');
    updateSelectionCount();
    groupModal.style.display = 'flex';
    setTimeout(() => modelSearchInput.focus(), 200);
}

function closeModal() { groupModal.style.display = 'none'; }

function renderModelList(filter) {
    const lowerFilter = filter.toLowerCase();
    const filtered = allModels.length > 0
        ? allModels.filter(m => m.id.toLowerCase().includes(lowerFilter) || m.vendor.toLowerCase().includes(lowerFilter))
        : FEATURED_MODELS.map(m => ({ id: m.id, vendor: m.vendor }));

    if (filtered.length === 0) {
        modelSelectGrid.innerHTML = '<div class="model-loading">No models found</div>';
        return;
    }

    // Limit display to 100 for performance
    const toShow = filtered.slice(0, 100);

    modelSelectGrid.innerHTML = toShow.map(m => {
        const isSelected = selectedModelIds.has(m.id);
        return `
            <div class="model-select-item${isSelected ? ' selected' : ''}" data-id="${m.id}">
                <span class="model-select-id">${m.id}</span>
                ${m.vendor ? `<span class="model-select-vendor">${m.vendor}</span>` : ''}
                <div class="model-select-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
            </div>`;
    }).join('');

    if (filtered.length > 100) {
        modelSelectGrid.innerHTML += `<div class="model-loading">Showing first 100 of ${filtered.length} results. Narrow your search.</div>`;
    }
}

function toggleModelSelection(modelId) {
    if (modalMode === 'custom1on1') {
        // Only 1 for custom 1:1
        selectedModelIds.clear();
        selectedModelIds.add(modelId);
    } else if (modalMode === 'endless') {
        // Limit to 2 for endless
        if (selectedModelIds.has(modelId)) {
            selectedModelIds.delete(modelId);
        } else {
            if (selectedModelIds.size >= 2) {
                const first = selectedModelIds.values().next().value;
                selectedModelIds.delete(first);
            }
            selectedModelIds.add(modelId);
        }
    } else {
        if (selectedModelIds.has(modelId)) {
            selectedModelIds.delete(modelId);
        } else {
            selectedModelIds.add(modelId);
        }
    }
    updateSelectionCount();
    // Update visual
    modelSelectGrid.querySelectorAll('.model-select-item').forEach(el => {
        el.classList.toggle('selected', selectedModelIds.has(el.dataset.id));
    });
}

function updateSelectionCount() {
    const count = selectedModelIds.size;
    if (modalMode === 'custom1on1') {
        selectionCount.textContent = `(${count}/1 selected)`;
    } else if (modalMode === 'endless') {
        selectionCount.textContent = `(${count}/2 selected)`;
    } else {
        selectionCount.textContent = `(${count} selected)`;
    }
}

function createFromModal() {
    const name = groupNameInput.value.trim();

    if (modalMode === 'custom1on1') {
        if (selectedModelIds.size !== 1) {
            modelSearchInput.value = '';
            modelSearchInput.placeholder = '⚠️ Select 1 model!';
            return;
        }
        const modelId = [...selectedModelIds][0];
        if (!customContacts.includes(modelId)) {
            customContacts.push(modelId);
            saveState();
        }
        closeModal();
        renderCustomChats();
        selectChat('custom', modelId);
    } else if (modalMode === 'endless') {
        if (selectedModelIds.size !== 2) {
            groupNameInput.value = '';
            groupNameInput.placeholder = '⚠️ Select exactly 2 models!';
            return;
        }
        const members = [...selectedModelIds];
        const ec = {
            id: 'endless_' + Date.now(),
            name: name || `${getModelInfo(members[0]).name} vs ${getModelInfo(members[1]).name}`,
            members,
        };
        endlessChats.push(ec);
        saveState();
        closeModal();
        renderEndlessChats();
        selectChat('endless', ec.id);
    } else {
        if (selectedModelIds.size < 2) {
            groupNameInput.value = '';
            groupNameInput.placeholder = '⚠️ Select at least 2 models!';
            return;
        }
        const group = {
            id: 'group_' + Date.now(),
            name: name || 'AI Group Chat',
            members: [...selectedModelIds],
        };
        groups.push(group);
        saveState();
        closeModal();
        renderGroups();
        selectChat('group', group.id);
    }
}

// ─────────────── CLEAR CHAT ───────────────
function clearCurrentChat() {
    if (!activeChat) return;
    if (endlessRunning && activeChat.type === 'endless') stopEndless();
    const chatKey = activeChat.type === 'custom' ? 'custom_' + activeChat.id : activeChat.id;
    chatHistories[chatKey] = [];
    saveState();
    renderMessages();
    renderContacts(); renderGroups(); renderEndlessChats(); renderCustomChats();
}

// ─────────────── DELETE CHAT ───────────────
function deleteCurrentChat() {
    if (!activeChat) return;
    const { type, id } = activeChat;

    if (type === 'group') {
        groups = groups.filter(g => g.id !== id);
        delete chatHistories[id];
    } else if (type === 'endless') {
        if (endlessRunning) stopEndless();
        endlessChats = endlessChats.filter(e => e.id !== id);
        delete chatHistories[id];
    } else if (type === 'custom') {
        customContacts = customContacts.filter(mid => mid !== id);
        delete chatHistories['custom_' + id];
    } else {
        return; // Can't delete featured 1:1 chats
    }

    saveState();
    activeChat = null;

    // Go back to first featured model
    renderGroups(); renderEndlessChats(); renderCustomChats();
    if (FEATURED_MODELS.length > 0) {
        selectChat('1on1', FEATURED_MODELS[0].id);
    }
}

// ─────────────── EMOJI ───────────────
function buildEmojiPicker() {
    emojiGrid.innerHTML = EMOJIS.map(e => `<div class="emoji-item" data-emoji="${e}">${e}</div>`).join('');
}

function toggleEmojiPicker() {
    const isOpen = emojiPicker.style.display !== 'none';
    emojiPicker.style.display = isOpen ? 'none' : 'block';
    emojiBtn.classList.toggle('active', !isOpen);
}

// ─────────────── SIDEBAR ───────────────
function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }

// ─────────────── INPUT ───────────────
function autoResizeInput() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    sendBtn.disabled = messageInput.value.trim().length === 0 || isAiResponding;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────── EVENTS ───────────────
function bindEvents() {
    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Contact / Group / Endless / Custom clicks
    contactsList.addEventListener('click', e => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });
    groupsList.addEventListener('click', e => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });
    endlessList.addEventListener('click', e => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });
    customList.addEventListener('click', e => {
        const item = e.target.closest('.contact-item');
        if (item) selectChat(item.dataset.type, item.dataset.id);
    });

    // Send & Stop
    sendBtn.addEventListener('click', sendMessage);
    stopBtn.addEventListener('click', stopEndless);

    messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    messageInput.addEventListener('input', () => { autoResizeInput(); updateSendButton(); });

    // Emoji
    emojiBtn.addEventListener('click', e => { e.stopPropagation(); toggleEmojiPicker(); });
    emojiGrid.addEventListener('click', e => {
        const item = e.target.closest('.emoji-item');
        if (item) { messageInput.value += item.dataset.emoji; messageInput.focus(); autoResizeInput(); updateSendButton(); }
    });
    document.addEventListener('click', e => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
            emojiBtn.classList.remove('active');
        }
    });

    // Clear & Delete
    clearChatBtn.addEventListener('click', clearCurrentChat);
    deleteChatBtn.addEventListener('click', deleteCurrentChat);

    // Modal
    newGroupBtn.addEventListener('click', () => openModal('group'));
    newEndlessBtn.addEventListener('click', () => openModal('endless'));
    newCustomBtn.addEventListener('click', () => openModal('custom1on1'));
    modalClose.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);
    modalCreateBtn.addEventListener('click', createFromModal);
    groupModal.addEventListener('click', e => { if (e.target === groupModal) closeModal(); });

    // Model search
    modelSearchInput.addEventListener('input', () => renderModelList(modelSearchInput.value));

    // Model selection
    modelSelectGrid.addEventListener('click', e => {
        const item = e.target.closest('.model-select-item');
        if (item) toggleModelSelection(item.dataset.id);
    });

    // Resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }
    });
}

// ─────────────── LAUNCH ───────────────
document.addEventListener('DOMContentLoaded', init);
