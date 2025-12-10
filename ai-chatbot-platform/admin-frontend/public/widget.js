(function () {
    // Configuration
    const SCRIPT_TAG = document.currentScript;
    const CHATBOT_ID = SCRIPT_TAG.getAttribute('data-chatbot-id');
    const API_URL = SCRIPT_TAG.getAttribute('data-api-url') || 'http://localhost:3000/api/v1/chat';
    const CONFIG_URL = API_URL.replace('/chat', `/chatbot/${CHATBOT_ID}/config`);

    if (!CHATBOT_ID) {
        console.error('Chatbot Widget: Missing data-chatbot-id attribute');
        return;
    }

    // Generate Session ID
    let sessionId = localStorage.getItem(`chat_session_${CHATBOT_ID}`);
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(`chat_session_${CHATBOT_ID}`, sessionId);
    }

    // Create Host Element
    const host = document.createElement('div');
    host.id = 'ai-chatbot-widget-host';
    document.body.appendChild(host);

    // Create Shadow DOM
    const shadow = host.attachShadow({ mode: 'open' });

    // CSS Variables Defaults
    const defaultTheme = {
        primaryColor: '#4F46E5',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: '12px'
    };

    // Styles
    const style = document.createElement('style');
    // Using CSS Variables for theming
    style.textContent = `
        :host {
            --chat-primary: ${defaultTheme.primaryColor};
            --chat-bg: ${defaultTheme.backgroundColor};
            --chat-text: ${defaultTheme.textColor};
            --chat-radius: ${defaultTheme.borderRadius};
            --chat-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: var(--chat-font);
        }
        .chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: var(--chat-primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .chat-button:hover {
            transform: scale(1.05);
        }
        .chat-button svg {
            width: 30px;
            height: 30px;
            fill: white;
        }
        .chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: var(--chat-bg);
            border-radius: var(--chat-radius);
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }
        .chat-window.open {
            opacity: 1;
            pointer-events: all;
            transform: translateY(0);
        }
        .chat-header {
            background: var(--chat-primary);
            color: white;
            padding: 16px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .close-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
        }
        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f9fafb; /* Inner background mainly static or derived? Let's keep it neutral for now, or match bg? */
            background: ${defaultTheme.backgroundColor === '#ffffff' ? '#f9fafb' : 'rgba(255,255,255,0.05)'};
            display: flex;
            flex-direction: column;
            gap: 10px;
            color: var(--chat-text);
        }
        .message {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: var(--chat-radius);
            font-size: 14px;
            line-height: 1.4;
        }
        .message.user {
            align-self: flex-end;
            background: var(--chat-primary);
            color: white;
            border-bottom-right-radius: 2px;
        }
        .message.bot {
            align-self: flex-start;
            background: #E5E7EB;
            color: #1F2937;
            border-bottom-left-radius: 2px;
        }
        .chat-input-area {
            padding: 16px;
            border-top: 1px solid #E5E7EB;
            display: flex;
            gap: 10px;
            background: var(--chat-bg);
        }
        .chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #D1D5DB;
            border-radius: 8px;
            outline: none;
            font-family: inherit;
        }
        .chat-input:focus {
            border-color: var(--chat-primary);
        }
        .send-btn {
            background: var(--chat-primary);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-family: inherit;
        }
        .send-btn:disabled {
            background: #9CA3AF;
        }
        .typing-indicator {
            font-size: 12px;
            color: #6B7280;
            margin-left: 10px;
            display: none;
        }
        .typing-indicator.visible {
            display: block;
        }
        /* Markdown tables */
        .message table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 13px;
        }
        .message th,
        .message td {
            border: 1px solid #D1D5DB;
            padding: 6px 8px;
            text-align: left;
        }
        .message th {
            background: #F3F4F6;
            font-weight: 600;
        }
        .message tr:nth-child(even) {
            background: #F9FAFB;
        }
    `;
    shadow.appendChild(style);

    // HTML Structure
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.innerHTML = `
        <div class="chat-window">
            <div class="chat-header">
                <span id="chat-title">Chat Support</span>
                <button class="close-btn">&times;</button>
            </div>
            <div class="chat-messages"></div>
            <div class="typing-indicator">AI is typing...</div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" placeholder="Type a message...">
                <button class="send-btn">Send</button>
            </div>
        </div>
        <div class="chat-button">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </div>
    `;
    shadow.appendChild(container);

    // Elements
    const chatButton = container.querySelector('.chat-button');
    const chatWindow = container.querySelector('.chat-window');
    const closeBtn = container.querySelector('.close-btn');
    const messagesContainer = container.querySelector('.chat-messages');
    const input = container.querySelector('.chat-input');
    const sendBtn = container.querySelector('.send-btn');
    const typingIndicator = container.querySelector('.typing-indicator');
    const chatTitle = container.querySelector('#chat-title');

    // State
    let isOpen = false;

    // Functions
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.classList.toggle('open', isOpen);
        if (isOpen) input.focus();
    }

    function applyTheme(theme) {
        if (!theme) return;

        const root = shadow.host; // or container, but CSS vars on host is better if allowed

        // We set vars on the host style 
        if (theme.primaryColor) root.style.setProperty('--chat-primary', theme.primaryColor);
        if (theme.backgroundColor) root.style.setProperty('--chat-bg', theme.backgroundColor);
        if (theme.textColor) root.style.setProperty('--chat-text', theme.textColor);
        if (theme.borderRadius) root.style.setProperty('--chat-radius', theme.borderRadius);

        // Update specific elements if needed
        // For dark mode backgrounds in message area, we might want to check luminosity?
        // simple heuristic:
        if (theme.backgroundColor && theme.backgroundColor.toLowerCase() !== '#ffffff') {
            // Assume dark or colored bg, make message area slightly different
            // This is a simple improvement, can be more robust
            messagesContainer.style.background = 'rgba(0,0,0,0.05)';
        } else {
            messagesContainer.style.background = '#f9fafb';
        }
    }

    async function fetchConfig() {
        try {
            const res = await fetch(CONFIG_URL);
            if (res.ok) {
                const config = await res.json();
                if (config.themeConfig) {
                    applyTheme(config.themeConfig);
                }
                if (config.name) {
                    chatTitle.textContent = config.name;
                }
            }
        } catch (e) {
            console.error('Failed to fetch chatbot config:', e);
        }
    }

    // Initialize
    fetchConfig();

    // Live Preview Listener
    // The preview.html dispatches 'chatbot-theme-update'
    window.addEventListener('chatbot-theme-update', (event) => {
        applyTheme(event.detail);
    });


    function parseMarkdown(text) {
        // 1. Escape HTML to prevent XSS (basic)
        let safeText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // 2. Bold: **text** -> <strong>text</strong>
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 3. Process lines for tables, lists, and text
        const lines = safeText.split('\n');
        let inList = false;
        let inTable = false;
        let processedLines = [];
        let i = 0;

        while (i < lines.length) {
            let line = lines[i];
            let isList = line.trim().startsWith('* ');
            let isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');

            // Check if this is the start of a table (current line and next line are table rows)
            if (isTableRow && !inTable && i + 1 < lines.length) {
                let nextLine = lines[i + 1].trim();
                // Check if next line is a separator (contains only |, -, and spaces)
                if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
                    // Start table
                    if (inList) {
                        processedLines.push('</ul>');
                        inList = false;
                    }
                    inTable = true;
                    processedLines.push('<table>');

                    // Parse header
                    processedLines.push('<thead><tr>');
                    let headers = line.split('|').filter(h => h.trim());
                    headers.forEach(h => {
                        processedLines.push(`<th>${h.trim()}</th>`);
                    });
                    processedLines.push('</tr></thead>');

                    // Skip separator line
                    i += 2;
                    processedLines.push('<tbody>');
                    continue;
                }
            }

            // Continue table rows
            if (inTable && isTableRow) {
                processedLines.push('<tr>');
                let cells = line.split('|').filter(c => c.trim());
                cells.forEach(c => {
                    processedLines.push(`<td>${c.trim()}</td>`);
                });
                processedLines.push('</tr>');
                i++;
                continue;
            }

            // End table if we were in one
            if (inTable && !isTableRow) {
                processedLines.push('</tbody></table>');
                inTable = false;
            }

            // Handle lists
            if (isList) {
                if (!inList) {
                    processedLines.push('<ul>');
                    inList = true;
                }
                processedLines.push(`<li>${line.trim().substring(2)}</li>`);
            } else if (!isTableRow) {
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                // Add <br> for text lines, except the last one
                if (i < lines.length - 1) {
                    processedLines.push(line + '<br>');
                } else {
                    processedLines.push(line);
                }
            }

            i++;
        }

        // Close any open tags
        if (inList) {
            processedLines.push('</ul>');
        }
        if (inTable) {
            processedLines.push('</tbody></table>');
        }

        return processedLines.join('');
    }

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;

        // Use innerHTML with parsed markdown
        msg.innerHTML = parseMarkdown(text);

        messagesContainer.appendChild(msg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        typingIndicator.classList.add('visible');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatbotId: CHATBOT_ID,
                    sessionId: sessionId,
                    message: text
                })
            });

            const data = await response.json();

            if (data.error) {
                addMessage('Error: ' + data.error, 'bot');
            } else {
                addMessage(data.response, 'bot');
            }
        } catch (err) {
            addMessage('Error connecting to server.', 'bot');
            console.error(err);
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            typingIndicator.classList.remove('visible');
            input.focus();
        }
    }

    // Event Listeners
    chatButton.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
