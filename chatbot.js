(function () {
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem('enovy_chat_history') || '[]'); }
    catch (e) { return []; }
  }
  function saveHistory(h) {
    try { sessionStorage.setItem('enovy_chat_history', JSON.stringify(h.slice(-30))); }
    catch (e) { /* ignore */ }
  }

  let history = loadHistory();

  function injectWidget() {
    const wrap = document.createElement('div');
    wrap.id = 'enovyChatWidget';
    wrap.innerHTML = `
      <button id="chatToggle" aria-label="Open chat assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      </button>
      <div id="chatPanel" class="chat-panel">
        <div class="chat-head">
          <div><b>ENOVY Air Assistant</b><span>Flights &middot; Bookings &middot; Support</span></div>
          <button id="chatClose" aria-label="Close chat">&times;</button>
        </div>
        <div class="chat-body" id="chatBody"></div>
        <form id="chatForm" class="chat-form">
          <input type="text" id="chatInput" placeholder="Ask about flights or your booking..." autocomplete="off">
          <button type="submit" aria-label="Send">&#10148;</button>
        </form>
      </div>`;
    document.body.appendChild(wrap);

    document.getElementById('chatToggle').addEventListener('click', () => {
      const panel = document.getElementById('chatPanel');
      panel.classList.toggle('open');
      if (panel.classList.contains('open') && history.length === 0) greet();
      if (panel.classList.contains('open')) document.getElementById('chatInput').focus();
    });
    document.getElementById('chatClose').addEventListener('click', () => {
      document.getElementById('chatPanel').classList.remove('open');
    });
    document.getElementById('chatForm').addEventListener('submit', onSend);

    renderHistory();
  }

  function greet() {
    addMessage('assistant', "Hi, I'm the ENOVY Air assistant. I can search flights, check or cancel a booking, or connect you with a human agent. How can I help?");
  }

  function renderHistory() {
    const body = document.getElementById('chatBody');
    body.innerHTML = '';
    history.forEach(m => appendBubble(m.role, m.content));
    body.scrollTop = body.scrollHeight;
  }

  function appendBubble(role, text) {
    const body = document.getElementById('chatBody');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(role, content) {
    history.push({ role, content });
    saveHistory(history);
    appendBubble(role, content);
  }

  async function onSend(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMessage('user', text);

    const body = document.getElementById('chatBody');
    const typing = document.createElement('div');
    typing.className = 'chat-msg assistant typing';
    typing.textContent = '...';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      typing.remove();
      addMessage('assistant', data.reply || "Sorry, I couldn't process that.");
    } catch (err) {
      typing.remove();
      addMessage('assistant', "I'm having trouble connecting right now. Please try again in a moment.");
    }
  }

  document.addEventListener('DOMContentLoaded', injectWidget);
})();
