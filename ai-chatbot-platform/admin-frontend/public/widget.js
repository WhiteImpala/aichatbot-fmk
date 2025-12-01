(function() {
    // Configuration
    const SCRIPT_TAG = document.currentScript;
    const CHATBOT_ID = SCRIPT_TAG.getAttribute('data-chatbot-id');
    const API_URL = 'http://localhost:3000/api/v1/chat'; // Should be configurable or detected

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

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .chat-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #4F46E5;
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
            background: white;
            border-radius: 12px;
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
            background: #4F46E5;
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
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .message {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.4;
        }
        .message.user {
            align-self: flex-end;
            background: #4F46E5;
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
        }
        .chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #D1D5DB;
            border-radius: 8px;
            outline: none;
        }
        .chat-input:focus {
            border-color: #4F46E5;
        }
        .send-btn {
            background: #4F46E5;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
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
    `;
    shadow.appendChild(style);

    // HTML Structure
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.innerHTML = `
        <div class="chat-window">
            <div class="chat-header">
                <span>Chat Support</span>
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

    // State
    let isOpen = false;

    // Functions
    function toggleChat() {
        isOpen = !isOpen;
        chatWindow.classList.toggle('open', isOpen);
        if (isOpen) input.focus();
    }

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.textContent = text;
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
