const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// ─── Enter to send, Shift+Enter for newline ───
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.focus();
  autoResizeInput();

  addMessage('user', message, getTimestamp());
  saveHistory();
  sendMessage();
});

// ─── Auto-resize textarea ───
input.addEventListener('input', autoResizeInput);
function autoResizeInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

// ─── Send message & stream response ───
async function sendMessage() {
  const thinkingId = Date.now();
  const timestamp = getTimestamp();
  const botEl = addMessage('bot', 'Berpikir...', timestamp, thinkingId);

  try {
    const bubbles = chatBox.querySelectorAll('.message:not(.thinking)');
    const conversation = [];

    // Build conversation from all non-thinking messages
    for (const el of bubbles) {
      const text = el.dataset.plain || el.textContent;
      if (!text || text === 'Berpikir...') continue;
      conversation.push({
        role: el.classList.contains('user') ? 'user' : 'model',
        text
      });
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    const reply = data.result || 'Maaf, tidak ada respons yang diterima.';

    // Typing effect: reveal characters one by one
    botEl.dataset.plain = reply;
    botEl.textContent = '';
    botEl.classList.remove('thinking');
    botEl.classList.add('typing');

    const chars = reply.split('');
    let i = 0;
    const speed = Math.max(15, Math.floor(2000 / chars.length));

    function typeChar() {
      if (i < chars.length) {
        botEl.textContent += chars[i];
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(typeChar, speed);
      } else {
        // Done typing — render markdown
        botEl.classList.remove('typing');
        botEl.innerHTML = renderMarkdown(reply);
        addQuickReplies(botEl);
        saveHistory();
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }
    typeChar();
  } catch (err) {
    botEl.textContent = err.message || 'Gagal mendapatkan respons dari server.';
    botEl.classList.remove('thinking');
    saveHistory();
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ─── Quick reply suggestions ───
const SUGGESTIONS = [
  'Rekomendasi destinasi wisata',
  'Trip budget hemat',
  'Itinerary 3 hari',
  'Tips perjalanan',
];

function addQuickReplies(botEl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'quick-replies';

  SUGGESTIONS.forEach((text) => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = text;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      input.value = text;
      input.focus();
      form.dispatchEvent(new Event('submit'));
    });
    wrapper.appendChild(btn);
  });

  botEl.appendChild(wrapper);
}

// ─── Chat history (localStorage) ───
function saveHistory() {
  const messages = [];
  chatBox.querySelectorAll('.message').forEach((el) => {
    const text = el.dataset.plain || el.textContent;
    if (!text || text === 'Berpikir...') return;
    messages.push({
      sender: el.classList.contains('user') ? 'user' : 'bot',
      text,
      time: el.dataset.time || '',
    });
  });

  // Don't save the initial greeting if no user messages exist
  if (messages.length <= 1 && messages[0]?.sender === 'bot') {
    localStorage.removeItem('chatHistory');
    return;
  }

  localStorage.setItem('chatHistory', JSON.stringify(messages));
}

function restoreHistory() {
  const saved = localStorage.getItem('chatHistory');
  if (!saved) return false;

  try {
    const messages = JSON.parse(saved);
    if (!Array.isArray(messages) || messages.length < 2) return false;

    chatBox.innerHTML = '';
    messages.forEach(({ sender, text, time }) => {
      const el = addMessage(sender, text, time);
      el.dataset.plain = text;
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Timestamp ───
function getTimestamp() {
  const now = new Date();
  return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

// ─── Add message to chat box ───
function addMessage(sender, text, time, id) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;

  if (text === 'Berpikir...') {
    msg.classList.add('thinking');
    msg.textContent = 'Berpikir...';
  } else {
    msg.dataset.plain = text;
    msg.textContent = text;
  }

  if (time) msg.dataset.time = time;
  if (id) msg.dataset.id = id;

  // Timestamp element
  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.textContent = time || '';
  msg.appendChild(timeEl);

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// ─── Page load ───
if (!restoreHistory()) {
  // Show greeting if no history to restore
  addMessage('bot', 'Halo! Ada yang bisa saya bantu untuk perencanaan perjalanan Anda?', getTimestamp());
}

// ─── Markdown renderer ───
function renderMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>');

  const lines = html.split('\n');
  let inUl = false, inOl = false;
  const result = [];

  for (const line of lines) {
    const ulMatch = line.match(/^\s*\*\s+(.+)/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);

    if (ulMatch) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (line === '') {
        result.push('<br>');
      } else if (!line.startsWith('<h') && !line.startsWith('<pre')) {
        result.push(`<p>${line}</p>`);
      } else {
        result.push(line);
      }
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  return result.join('\n');
}
