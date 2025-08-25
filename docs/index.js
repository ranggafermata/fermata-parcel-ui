// This is the complete, final, and corrected index.js

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. All Variable Declarations ---
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const responseBox = document.getElementById('response-box');
  const box = responseBox;
  const yearSpan = document.getElementById('year');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const fileInput = document.getElementById('file-input');
  let attachedFile = null;
  let conversationHistory = [];
  let currentSessionId = null; //

  const sendBtn = document.getElementById('send-btn');
  const stopBtn = document.getElementById('stop-btn');
  let currentAbortController = null;
  let isStreaming = false;
  let streamAborted = false;

  const TEXT_API_BASE = (typeof TEXT_API_URL !== 'undefined') ? TEXT_API_URL : (window.TEXT_API_URL || '');
  const VISION_API_BASE = (typeof VISION_API_URL !== 'undefined') ? VISION_API_URL : (window.VISION_API_URL || '');

  // Selected model (default = Effort 1)
  let selectedModel = localStorage.getItem('selectedModel') || 'effort';
  // expose small helper to show selection in UI (badge updated shortly)
  window.getSelectedModel = () => selectedModel;
  // allow clicks from inline HTML to change model
  window.effort = () => {
    if (isStreaming) return alert("Cannot change model while generation is running.");
    selectedModel = 'effort';
    localStorage.setItem('selectedModel', selectedModel);
    const badge = document.getElementById('currentModelBadge');
    if (badge) badge.textContent = 'Effort 1';
  };
  window.endeavor = () => {
    if (isStreaming) return alert("Cannot change model while generation is running.");
    selectedModel = 'endeavor';
    localStorage.setItem('selectedModel', selectedModel);
    const badge = document.getElementById('currentModelBadge');
    if (badge) badge.textContent = 'Endeavor 1 (preview)';
  };

  // Initialize badge text
  const modelBadgeInit = document.getElementById('currentModelBadge');
  if (modelBadgeInit) {
    modelBadgeInit.textContent = selectedModel === 'endeavor' ? 'Endeavor 1 (preview)' : 'Effort 1';
  }

  const researchModal = new bootstrap.Modal(document.getElementById('researchModal'));
  const researchBtn = document.getElementById('researchBtn');
  const researchResultPre = document.getElementById('researchResult');

  // Get references to the new inputs and buttons
  const searchInput = document.getElementById('researchQuerySearch');
  const searchButton = document.getElementById('researchSubmitBtnSearch');
  const extractInput = document.getElementById('researchQueryExtract');
  const extractButton = document.getElementById('researchSubmitBtnExtract');

  researchBtn.addEventListener('click', () => {
    researchModal.show();
  });

  // Generic function to perform the research task
  async function performResearch(task, query) {
    if (!query) return;

    researchResultPre.textContent = 'Working...';
    searchButton.disabled = true;
    extractButton.disabled = true;

    try {
      const res = await fetch(`${TEXT_API_BASE}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, query })
      });
      
      const data = await res.json();
      
      if (data.error) {
        researchResultPre.textContent = `Error: ${data.error}`;
      } else {
        researchResultPre.textContent = JSON.stringify(data, null, 2);
      }

    } catch (error) {
      researchResultPre.textContent = `Error: ${error.message}`;
    } finally {
      searchButton.disabled = false;
      extractButton.disabled = false;
    }
  }

  // Add listeners to both buttons
  searchButton.addEventListener('click', () => {
    performResearch('search', searchInput.value.trim());
  });

  extractButton.addEventListener('click', () => {
    performResearch('extract', extractInput.value.trim());
  });
  // --- 2. All Functions ---

  // Language Translation
  const translations = {
    en: { greeting: "Hello!", placeholder: "Ask anything...", recent: "Recent", noHistory: "No history yet", signInNotice: "Sign in to save your chat history and access personalized features.", mainMenu: "Main Menu" },
    id: { greeting: "Halo!", placeholder: "Tanyakan apa saja...", recent: "Terkini", noHistory: "Belum ada riwayat", signInNotice: "Masuk untuk menyimpan riwayat obrolan Anda dan mengakses fitur yang dipersonalisasi.", mainMenu: "Menu Utama" },
    fr: { greeting: "Bonjour!", placeholder: "Demandez n'importe quoi...", recent: "Récents", noHistory: "Aucun historique", signInNotice: "Connectez-vous pour enregistrer votre historique de discussion et accéder à des fonctionnalités personnalisées.", mainMenu: "Menu Principal" },
    es: { greeting: "Hola!", placeholder: "Pregunta cualquier cosa...", recent: "Reciente", noHistory: "Sin historia", signInNotice: "Inicie sesión para guardar su historial de chat y acceder a funciones personalizadas.", mainMenu: "Menú Principal" },
    ru: { greeting: "Привет!", placeholder: "Спросите что угодно...", recent: "Недавние", noHistory: "Истории пока нет", signInNotice: "Войдите, чтобы сохранить историю чата и получить доступ к персональным функциям.", mainMenu: "Главное меню" },
    uk: { greeting: "Привіт!", placeholder: "Запитайте що завгодно...", recent: "Недавні", noHistory: "Історії поки немає", signInNotice: "Увійдіть, щоб зберегти історію чату та отримати доступ до персоналізованих функцій.", mainMenu: "Головне меню" }
  };

  function changeLanguage(lang) {
    const langData = translations[lang];
    document.getElementById('chat-input').placeholder = langData.placeholder;
    document.querySelector('#sidebar h5').textContent = langData.recent;
    document.querySelector('#authNotice span').textContent = langData.signInNotice;
    const historyList = document.getElementById('chat-history');
    if (historyList.querySelector('li').textContent.includes('history') || historyList.querySelector('li').textContent.includes('riwayat') || historyList.querySelector('li').textContent.includes('historique') || historyList.querySelector('li').textContent.includes('historia') || historyList.querySelector('li').textContent.includes('Истории') || historyList.querySelector('li').textContent.includes('Історії')) {
        historyList.innerHTML = `<li>${langData.noHistory}</li>`;
    }

    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      mainMenu.textContent = langData.mainMenu;
    }
    const helloText = document.getElementById('hello-text');
    if (helloText) { // Check if the element exists before manipulating it
      helloText.textContent = langData.greeting; // 1. Set the new text

      // 2. Force the animation to restart
      helloText.style.animation = 'none';
      helloText.offsetHeight; // This is a trick to trigger a DOM reflow
      helloText.style.animation = ''; // Reset the animation property

      // 3. Re-apply the animation with the correct number of steps for the new word
      const typingSpeed = 2; // in seconds
      const newSteps = langData.greeting.length;
      setTimeout(() => {
        helloText.style.animation = `typing ${typingSpeed}s steps(${newSteps}, end), blink-caret .75s step-end infinite`;
      }, 10);
    }

    localStorage.setItem('preferredLanguage', lang);
  }
    // Make the function globally available for the HTML onclick attributes
  window.changeLanguage = changeLanguage;

  // Load Sidebar History
  async function loadSidebarHistory() {
    const historyList = document.getElementById("chat-history");
    historyList.innerHTML = "";
    const user = firebase.auth().currentUser;
    if (!user) return;

    const db = firebase.firestore();
    // 1. Query the 'chats' collection to get a list of sessions
    const snapshot = await db.collection("chats")
      .where("uid", "==", user.uid)
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    if (snapshot.empty) {
      historyList.innerHTML = `<li>${translations[localStorage.getItem('preferredLanguage') || 'en'].noHistory}</li>`;
      return;
    }

    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    // 2. Create a list item for each session
    snapshot.forEach(doc => {
      const sessionData = doc.data();
      const sessionId = doc.id;
      
      const entry = document.createElement("li");

      // Create a span for the title to allow for editing
      const titleSpan = document.createElement("span");
      titleSpan.className = "history-item-title";
      titleSpan.textContent = sessionData.title || "Untitled Chat";
      
      // Create container for action icons
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "history-item-actions";

      // Create Edit Icon
      const editIcon = document.createElement("div");
      editIcon.className = "editBtn";
      editIcon.title = "Edit title";
      editIcon.onclick = (e) => {
        e.stopPropagation(); // Prevent the chat from loading
        editSessionTitle(entry, titleSpan, sessionId);
      };

      // Create Delete Icon
      const deleteIcon = document.createElement("div");
      deleteIcon.className = "deleteBtn btn btn-sm";
      deleteIcon.title = "Delete chat";
      deleteIcon.onclick = (e) => {
        e.stopPropagation(); // Prevent the chat from loading
        
        // Setup and show the confirmation modal
        document.getElementById('chatTitleToDelete').textContent = `"${sessionData.title}"`;
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        // Clone and replace the button to remove old event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
          deleteSession(sessionId);
          deleteModal.hide();
        };
        
        deleteModal.show();
      };

      actionsDiv.appendChild(editIcon);
      actionsDiv.appendChild(deleteIcon);
      
      entry.appendChild(titleSpan);
      entry.appendChild(actionsDiv);

      entry.dataset.sessionId = sessionId;

      // 3. When a session is clicked, load its entire history
      entry.onclick = async () => {
        const sessionId = entry.dataset.sessionId;
        console.log(`Loading session: ${sessionId}`);

        // Fetch all messages for this session
        const messagesSnapshot = await db.collection("chats").doc(sessionId).collection("messages").orderBy("timestamp").get();

        // Clear the current state
        box.innerHTML = "";
        conversationHistory = [];
        currentSessionId = sessionId;

        // Rebuild the conversation history and the UI
        messagesSnapshot.forEach(msgDoc => {
          const msgData = msgDoc.data();
          conversationHistory.push(msgData); // Add to local history

          // Create the chat bubble in the UI
          const bubble = document.createElement("div");
          bubble.className = `chat-bubble ${msgData.role} align-self-${msgData.role === 'user' ? 'end' : 'start'} text-light`;
          
          // Handle potential images in user messages
          if (msgData.role === 'user' && msgData.imageUrl) {
              const imgInChat = document.createElement('img');
              imgInChat.src = msgData.imageUrl;
              // ... (add styles for image) ...
              bubble.appendChild(imgInChat);
          }
          
          renderFormattedResponse(bubble, msgData.content);
          box.appendChild(bubble);
        });
        
        document.querySelector('main').classList.add('chat-active');
        box.scrollTop = box.scrollHeight;
      };
      historyList.appendChild(entry);
    });
  }

  function editSessionTitle(listItem, titleSpan, sessionId) {
    const currentTitle = titleSpan.textContent;
    
    // Replace the span with an input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = currentTitle;
    inputField.className = 'form-control form-control-sm bg-dark text-light';
    
    // Temporarily remove the onclick to load chat
    listItem.onclick = null;

    inputField.onblur = () => saveNewTitle(listItem, titleSpan, inputField.value, sessionId); // Save on focus loss
    inputField.onkeydown = (e) => {
      if (e.key === 'Enter') inputField.blur(); // Save on Enter
      if (e.key === 'Escape') { // Cancel on Escape
        titleSpan.textContent = currentTitle;
        listItem.replaceChild(titleSpan, inputField);
        loadSidebarHistory(); // Reload to restore original state
      }
    };
    
    listItem.replaceChild(inputField, titleSpan);
    inputField.focus();
  }

  async function saveNewTitle(listItem, titleSpan, newTitle, sessionId) {
    if (!newTitle.trim()) return; // Don't save empty titles

    const user = firebase.auth().currentUser;
    if (!user) return;

    const db = firebase.firestore();
    await db.collection("chats").doc(sessionId).update({ title: newTitle });

    // Update the title in the UI
    titleSpan.textContent = newTitle;

    listItem.replaceChild(titleSpan, listItem.querySelector('input'));

    console.log(`Title for session ${sessionId} updated to "${newTitle}"`);
    loadSidebarHistory(); // Reload the history to show the change and restore click handlers
  }

  async function deleteSession(sessionId) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    console.log(`Deleting session: ${sessionId}`);
    const db = firebase.firestore();

    // Note: Deleting a document does not delete its subcollections.
    // For a complete cleanup, you'd need a Cloud Function.
    // For this client-side version, we'll just delete the main session document.
    // The messages will become "orphaned" but inaccessible through the UI.
    await db.collection("chats").doc(sessionId).delete();
    
    // If this was the currently loaded chat, start a new one
    if (currentSessionId === sessionId) {
      document.getElementById("newChatBtn").click();
    }
    
    loadSidebarHistory();
  }

  // Render Formatted Response (with code blocks)
  function renderFormattedResponse(container, text) {
    container.innerHTML = '';
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        const p = document.createElement('p');
        p.textContent = plainText;
        p.style.margin = '0';
        container.appendChild(p);
      }
      const language = match[1] || 'plaintext';
      const code = match[2].trim();
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      const header = document.createElement('div');
      header.className = 'code-block-header';
      const langSpan = document.createElement('span');
      langSpan.textContent = language;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = 'Copy Code';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 2000);
        });
      };
      header.appendChild(langSpan);
      header.appendChild(copyBtn);
      const pre = document.createElement('pre');
      const codeEl = document.createElement('code');
      codeEl.className = `language-${language}`;
      codeEl.textContent = code;
      pre.appendChild(codeEl);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
      container.appendChild(wrapper);
      lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      const p = document.createElement('p');
      p.textContent = remainingText;
      p.style.margin = '0';
      container.appendChild(p);
    }
    Prism.highlightAll();
  }


  // --- 3. Executable Code & Event Listeners ---

  // Set footer year
  yearSpan.textContent = new Date().getFullYear();

  // Create and prepend the "New Chat" button
  const newChatBtn = document.createElement("button");
  newChatBtn.className = "btn btn-outline-light btn-sm mb-3 align-self-start";
  newChatBtn.textContent = "+ New Chat";
  newChatBtn.onclick = () => {
    document.querySelector('main').classList.remove('chat-active');
    box.innerHTML = "";
    chatInput.value = "";
    chatInput.style.height = 'auto';
    if (attachedFile) {
      attachedFile = null;
      fileInput.value = '';
      imagePreviewContainer.style.display = 'none';
    }
    conversationHistory = [];
    currentSessionId = null;
  };
  document.getElementById("chat-history").parentElement.prepend(newChatBtn);

  // Main form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInput = chatInput.value.trim();
    if (!userInput && !attachedFile) return;

    // --- Smart History Management (now in the frontend!) ---
    const MAX_TURNS = 4; // A turn is a user message and a bot response
    if (conversationHistory.length > MAX_TURNS * 2) {
        // Keep only the most recent messages
        conversationHistory = conversationHistory.slice(-(MAX_TURNS * 2));
        console.log(`History truncated to the last ${MAX_TURNS} turns.`);
    }

    // --- UI and History Update ---
    document.querySelector('main').classList.add('chat-active');
    const currentLang = localStorage.getItem('preferredLanguage') || 'en';
    
    // Add user's message to the history *before* sending
    if (userInput) {
        conversationHistory.push({ role: 'user', content: userInput });
    }

    // --- Create User Bubble ---
    if (userInput || attachedFile) {
        const userBubble = document.createElement("div");
        userBubble.className = "chat-bubble user align-self-end text-light";
        if (attachedFile) {
            const imgInChat = document.createElement('img');
            imgInChat.src = document.getElementById('image-preview').src;
            imgInChat.style.maxWidth = '100%';
            imgInChat.style.maxHeight = '300px';
            imgInChat.style.borderRadius = '0.5rem';
            imgInChat.style.marginBottom = userInput ? '0.5rem' : '0';
            userBubble.appendChild(imgInChat);
        }
        if (userInput) {
            const textNode = document.createElement('p');
            textNode.textContent = userInput;
            textNode.style.margin = '0';
            userBubble.appendChild(textNode);
        }
        box.appendChild(userBubble);
        box.scrollTop = box.scrollHeight;
    }
    

    const formData = new FormData();
    formData.append('prompt', userInput);
    formData.append('language', currentLang);
    formData.append('history', JSON.stringify(conversationHistory.slice(0, -1))); // Send history *before* the current prompt

    // Attach the selected model so backend can pick the right LLM
    formData.append('model_choice', localStorage.getItem('selectedModel') || 'effort');

    const imageToSend = attachedFile;
    const imageDataUrl = imageToSend ? document.getElementById('image-preview').src : null;
    if (imageToSend) {
        formData.append('image', imageToSend);
    }

    chatInput.value = "";
    chatInput.style.height = 'auto';
    if (attachedFile) {
      attachedFile = null;
      fileInput.value = '';
      imagePreviewContainer.style.display = 'none';
    }

    const botBubble = document.createElement("div");
    botBubble.className = "chat-bubble bot align-self-start text-light";
    botBubble.innerHTML = '<span class="typing-dots">...</span>';
    box.appendChild(botBubble);
    box.scrollTop = box.scrollHeight;

    let fullResponse = "";
    try {
        currentAbortController = new AbortController();
        stopBtn.classList.remove('d-none');
        sendBtn.disabled = true;

            // The router logic: choose the URL based on whether an image exists
        const targetUrl = imageToSend ? `${VISION_API_URL}/describe_image` : `${TEXT_API_URL}/completion`;
            
        const res = await fetch(targetUrl, {
            method: 'POST',
            body: formData,
            signal: currentAbortController.signal
        });

        if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }

        if (imageToSend) {
                // --- Handle single JSON response from Vision API ---
            const data = await res.json();
            fullResponse = data.content || `[Error: ${data.error}]`;
            renderFormattedResponse(botBubble, fullResponse);
        } else {
                // --- Handle streaming response from Text API ---
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            botBubble.innerHTML = "";
            let streamAborted = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done || currentAbortController.signal.aborted) {
                    if (currentAbortController.signal.aborted) streamAborted = true;
                    break;
            }if (streamAborted) {
                    renderFormattedResponse(botBubble, fullResponse + " [Stopped]");
            } else {
                    renderFormattedResponse(botBubble, fullResponse);
          }if (streamAborted) { aborted = true; break; }

            const chunk = decoder.decode(value);
            // Server-Sent Events might send multiple data chunks at once
            const lines = chunk.split('\n\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.substring(6);
                        if (jsonStr) {
                            const data = JSON.parse(jsonStr);
                            const token = data.content;
                            fullResponse += token;
                            
                            // Use renderFormattedResponse to handle potential Markdown in the full stream
                            renderFormattedResponse(botBubble, fullResponse + "▌"); // Add a cursor during streaming
                            box.scrollTop = box.scrollHeight;
                        }
                    } catch (e) {
                        console.error("Failed to parse JSON chunk:", line);
                    }
                }
            }
        }}
        
        // Final render without the cursor
        box.scrollTop = box.scrollHeight;

        if (!currentAbortController.signal.aborted) {
            conversationHistory.push({ role: 'assistant', content: fullResponse });
        }

        // Save the full response to Firebase
        if (firebase.auth().currentUser) {
            const db = firebase.firestore();
            const user = firebase.auth().currentUser;
            const userMessage = {
                role: 'user',
                content: userInput,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            const botMessage = {
                role: 'assistant',
                content: fullResponse,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (currentSessionId === null) {
                // This is the first message of a new session
                const newChatRef = await db.collection("chats").add({
                    uid: user.uid,
                    title: userInput.substring(0, 40), // Use first 40 chars of prompt as title
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                currentSessionId = newChatRef.id;
                // Save the first two messages
                await newChatRef.collection("messages").add(userMessage);
                if (!streamAborted) await newChatRef.collection("messages").add(botMessage);
                loadSidebarHistory(); // Reload sidebar to show the new chat
            } else {
                // This is an existing session, just add the new messages
                const chatRef = db.collection("chats").doc(currentSessionId);
                await chatRef.collection("messages").add(userMessage);
                if (!streamAborted) await chatRef.collection("messages").add(botMessage);
            }
        }
    } catch (error) {
      // Handle abort separately so user sees a clear message
      if (error.name === 'AbortError') {
        streamAborted = true;
        botBubble.textContent = "⏹ Generation stopped.";
      } else {
        botBubble.textContent = "⚠️ Error: " + error.message;
        console.error("API Error:", error);
      }
    }
    finally {
          currentAbortController = null;
          stopBtn.classList.add('d-none');
          sendBtn.disabled = false;
        }
  });

  // Stop button: abort the current streaming request
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      // mark aborted so streaming loop and post-save logic know it was cancelled
      streamAborted = true;
      if (currentAbortController) {
        try {
          currentAbortController.abort();
        } catch (e) { /* ignore */ }
      }
      // immediate UI feedback
      stopBtn.style.display = 'none';
      if (sendBtn) sendBtn.disabled = false;
    });
  }


  // Other listeners
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  });

  chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
    }
  });

  document.getElementById("file-btn").addEventListener("click", () => {
    fileInput.click();
  });

  removeImageBtn.addEventListener("click", () => {
    attachedFile = null;
    fileInput.value = '';
    imagePreviewContainer.style.display = 'none';
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      attachedFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreviewContainer.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    }
  });

  // --- 4. Initialization on Page Load ---
  
  // Sidebar hover/pin logic
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  sidebarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("pinned");
    if (sidebar.classList.contains("pinned")) {
      sidebar.classList.add("active");
    }
  });
  sidebar.addEventListener('mouseenter', () => {
    sidebar.classList.add('active');
  });
  sidebar.addEventListener('mouseleave', () => {
    if (!sidebar.classList.contains('pinned')) {
      sidebar.classList.remove('active');
    }
  });
  
  // Firebase Auth UI logic
  const auth = firebase.auth();
  const db = firebase.firestore();
  auth.onAuthStateChanged((user) => {
    const signin = document.getElementById('signinOption');
    const signout = document.getElementById('signoutOption');
    const info = document.getElementById('userInfo');
    if (user) {
      signin.classList.add('d-none');
      signout.classList.remove('d-none');
      info.classList.remove('d-none');
      info.innerHTML = `<strong>${user.displayName}</strong><br><small>${user.email}</small>`;
      loadSidebarHistory();
    } else {
      signin.classList.remove('d-none');
      signout.classList.add('d-none');
      info.classList.add('d-none');
      setTimeout(() => { document.getElementById('authNotice').style.display = 'block'; }, 1500);
    }
  });
  
  // Set initial language
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang) {
    changeLanguage(savedLang);
  } else {
    changeLanguage('en');
  }

});
