// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    const newChatBtn = document.getElementById('newChatBtn');
    const conversationList = document.querySelector('.conversation-history');

    let conversationId = null; // ID da conversa atual
    let isAssistantTyping = false; // Estado do indicador de digitação

    // Carregar a lista de conversas ao iniciar
    loadConversations();

    // Configurar o Marked.js para usar o Prism.js para realce de sintaxe
    marked.setOptions({
        highlight: function(code, lang) {
            if (Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            } else {
                return Prism.highlight(code, Prism.languages['clike'], 'clike'); // fallback genérico
            }
        }
    });

    // Evento de envio de mensagem
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const message = messageInput.value.trim();
        if (message) {
            if (!conversationId) {
                // Iniciar nova conversa com o texto da mensagem como título
                startNewConversation(message);
            } else {
                addMessage('user', message);
                messageInput.value = '';

                // Enviar a mensagem para o backend Flask
                sendMessageToBackend(message);
            }
        }
    });

    messageInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();  
            messageInput.value += "\n";
            messageInput.style.height = "auto";
        
            // Ajusta a altura com base no conteúdo, até o limite máximo
            if (messageInput.scrollHeight > 150) {
                // Se o conteúdo ultrapassar o limite, fixa a altura máxima
                messageInput.style.height = "150px";
            } else {
                // Caso contrário, permite que o textarea aumente conforme o conteúdo
                messageInput.style.height = messageInput.scrollHeight + "px";
            }
        }
    });

    // Adicionar overlay para fechar o menu quando clicado fora dele
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Evento para abrir/fechar o menu lateral (para dispositivos móveis)
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    });

    // Evento para fechar o sidebar ao clicar no overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    });

    // Evento para o botão "Nova conversa"
    newChatBtn.addEventListener('click', () => {
        conversationId = null;
        chatMessages.innerHTML = '';
    });

    // Função para iniciar uma nova conversa
    function startNewConversation(initialMessage) {
        const title = initialMessage.substring(0, 50);
        fetch('/api/start_conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: title })
        })
        .then(response => response.json())
        .then(data => {
            conversationId = data.conversation_id;
            chatMessages.innerHTML = '';

            // Enviar a mensagem inicial
            addMessage('user', initialMessage);
            messageInput.value = '';
            sendMessageToBackend(initialMessage);

            // Atualizar a lista de conversas e selecionar a nova conversa
            loadConversations(conversationId);
        })
        .catch(error => {
            console.error('Erro ao iniciar nova conversa:', error);
        });
    }

    // Função para carregar a lista de conversas
    function loadConversations(selectedConversationId = null) {
        fetch('/api/conversations')
            .then(response => response.json())
            .then(data => {
                displayConversations(data.conversations);

                if (selectedConversationId) {
                    selectConversation(selectedConversationId);
                } else if (data.conversations && data.conversations.length > 0) {
                    const lastConv = data.conversations[data.conversations.length - 1];
                    selectConversation(lastConv.id);
                }
            })
            .catch(error => {
                console.error('Erro ao carregar conversas:', error);
            });
    }

    // Função para exibir as conversas no menu lateral
    function displayConversations(conversations) {
        conversationList.innerHTML = ''; // Limpar a lista
        conversations.forEach(conv => {
            const convItem = document.createElement('div');
            convItem.classList.add('conversation-item');
            convItem.textContent = conv.title;
            convItem.dataset.id = conv.id; // Armazenar o ID da conversa no dataset
            convItem.addEventListener('click', () => {
                selectConversation(conv.id);
            });
            // Destacar a conversa selecionada
            if (conv.id === conversationId) {
                convItem.classList.add('active');
            }
            conversationList.appendChild(convItem);
        });
    }

    // Função para selecionar uma conversa
    function selectConversation(id) {
        if (conversationId !== id) {
            conversationId = id;
            loadConversationMessages(id);
            // Atualizar o destaque na lista de conversas
            const conversationItems = document.querySelectorAll('.conversation-item');
            conversationItems.forEach(item => {
                item.classList.toggle('active', parseInt(item.dataset.id) === id);
            });
        }
    }

    // Função para carregar as mensagens de uma conversa
    function loadConversationMessages(id) {
        fetch(`/api/conversation/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.messages) {
                    chatMessages.innerHTML = '';
                    data.messages.forEach(msg => {
                        addMessage(msg.role, msg.content);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mensagens da conversa:', error);
            });
    }

    // Função para adicionar mensagens na interface
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);

        const innerDiv = document.createElement('div');
        innerDiv.classList.add('message-content');

        if (role === 'assistant') {
            // Converter o conteúdo markdown em HTML
            const htmlContent = marked.parse(content);
            // Sanitizar o HTML para evitar XSS
            innerDiv.innerHTML = DOMPurify.sanitize(htmlContent);
        } else {
            // Escapar o conteúdo do usuário
            innerDiv.textContent = content;
        }

        messageDiv.appendChild(innerDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Reprocessar o código para aplicar o realce de sintaxe
        Prism.highlightAllUnder(messageDiv);
    }

    // Função para enviar a mensagem ao backend
    function sendMessageToBackend(message) {
        // Mostrar o indicador de digitação
        showTypingIndicator();

        fetch('/api/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversation_id: conversationId, // Enviar o ID da conversa atual
                model_name: 'llama3.2' // Opcional: especificar o modelo
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remover o indicador de digitação
            removeTypingIndicator();

            if (data.error) {
                addMessage('assistant', 'Desculpe, ocorreu um erro ao processar sua mensagem.');
                console.error('Erro do servidor:', data.error);
            } else {
                // Adicionar a resposta do assistente
                addMessage('assistant', data.reply);
            }
        })
        .catch(error => {
            // Remover o indicador de digitação
            removeTypingIndicator();

            addMessage('assistant', 'Desculpe, não foi possível conectar ao servidor.');
            console.error('Erro de rede:', error);
        });
    }

    // Função para mostrar o indicador de digitação
    function showTypingIndicator() {
        if (!isAssistantTyping) {
            isAssistantTyping = true;
            const typingIndicator = document.createElement('div');
            typingIndicator.classList.add('message', 'assistant', 'typing');
            typingIndicator.innerHTML = `
                <div class="message-content">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            `;
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Função para remover o indicador de digitação
    function removeTypingIndicator() {
        if (isAssistantTyping) {
            isAssistantTyping = false;
            const typingIndicators = chatMessages.getElementsByClassName('typing');
            while (typingIndicators[0]) {
                typingIndicators[0].parentNode.removeChild(typingIndicators[0]);
            }
        }
    }
});