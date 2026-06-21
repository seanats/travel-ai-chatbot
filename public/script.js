const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.focus();

  appendMessage('user', message);
  sendMessage();
});

async function sendMessage() {
  const thinkingId = Date.now();
  appendMessage('bot', 'Berpikir...', thinkingId);

  try {
    const bubbles = chatBox.querySelectorAll('.message');
    const conversation = [];

    bubbles.forEach((el) => {
      const text = el.textContent;
      if (text === 'Berpikir...') return;

      conversation.push({
        role: el.classList.contains('user') ? 'user' : 'model',
        text
      });
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    const thinkingEl = document.querySelector(`[data-id="${thinkingId}"]`);
    if (thinkingEl) {
      thinkingEl.innerHTML = data.result
        ? renderMarkdown(data.result)
        : 'Maaf, tidak ada respons yang diterima.';
    }
  } catch (err) {
    const thinkingEl = document.querySelector(`[data-id="${thinkingId}"]`);
    if (thinkingEl) {
      thinkingEl.textContent = err.message || 'Gagal mendapatkan respons dari server.';
    }
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Greeting on page load
appendMessage('bot', 'Halo! Ada yang bisa saya bantu untuk perencanaan perjalanan Anda?');

function appendMessage(sender, text, id) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  if (id) msg.dataset.id = id;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

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
  let inUl = false;
  let inOl = false;
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
