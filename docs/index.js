// This is the complete, final, and corrected index.js

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. All Variable Declarations ---
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const responseBox = document.getElementById('response-box');
  const box = responseBox;
  const yearSpan = document.getElementById('year');
  const fileInput = document.getElementById('file-input');
  const sendBtn = document.getElementById('send-btn');
  const micBtn = document.getElementById('mic-btn');
  const resultScreen = document.getElementById('result-screen');
  const welcomeScreen = document.getElementById('welcome-screen');

// --- Microphone Recording Variables ---
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
  }

  // --- NEW: Microphone Button Logic (guarded if mic exists) ---
  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (isRecording) {
        // --- Stop Recording ---
        mediaRecorder.stop();
        isRecording = false;
        micBtn.style.filter = ''; // Reset icon color
        console.log('Recording stopped.');
      } else {
        // --- Start Recording ---
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          isRecording = true;
          micBtn.style.filter = 'invert(50%) sepia(100%) saturate(2000%) hue-rotate(0deg)'; // Reddish color
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);

          mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], "voice_input.wav", { type: "audio/wav" });
            
            try {
              if (typeof displayFilePreview === 'function') displayFilePreview(audioFile);
            } catch (e) { console.warn('displayFilePreview not available', e); }

            // Automatically submit the form with the recorded audio (if form exists)
            if (chatForm && typeof chatForm.requestSubmit === 'function') chatForm.requestSubmit();
            
            // Clean up the stream tracks
            stream.getTracks().forEach(track => track.stop());
          };
          
          mediaRecorder.start();
          console.log('Recording started...');

        } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("Could not access microphone. Please check your browser permissions.");
        }
      }
    });
  } else {
    console.warn('mic-btn not found; microphone features disabled');
  }

  // Research modal and buttons (if they exist)
  const researchModalEl = document.getElementById('researchModal');
  const researchBtn = document.getElementById('researchBtn');
  const researchResultPre = document.getElementById('researchResult');
  const searchInput = document.getElementById('researchQuerySearch');
  const searchButton = document.getElementById('researchSubmitBtnSearch');

  if (researchBtn && researchModalEl) {
    const researchModal = new bootstrap.Modal(researchModalEl);
    researchBtn.addEventListener('click', () => {
      researchModal.show();
    });
  }

  // Generic function to perform the research task
  async function performResearch(task, query) {
    if (!query || !researchResultPre) return;

    researchResultPre.textContent = 'Working...';
    if (searchButton) searchButton.disabled = true;

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
      if (searchButton) searchButton.disabled = false;
    }
  }

  // Add listeners to both buttons (guarded)
  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      performResearch('search', searchInput.value.trim());
    });
  }

  // Attach per-form handlers so duplicate IDs don't block events.
  const chatForms = document.querySelectorAll('#chat-form');
  if (chatForms && chatForms.length) {
    chatForms.forEach(form => {
      // Find the textarea (may share the same id, so query within the form)
      const localInput = form.querySelector('#chat-input') || form.querySelector('textarea');
      const submitBtn = form.querySelector('#send-btn') || form.querySelector('button[type="submit"]');

      // Click on the send button submits the local form
      if (submitBtn) {
        submitBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { bubbles: true }));
          }
        });
      }

      // Keyboard handling for Enter / Shift+Enter on the local textarea
      if (localInput) {
        localInput.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' && !ev.shiftKey) {
            ev.preventDefault();
            if (typeof form.requestSubmit === 'function') {
              form.requestSubmit();
            } else {
              form.dispatchEvent(new Event('submit', { bubbles: true }));
            }
          }
          // Shift+Enter will insert a newline by default
        });
      }

      // Submit handler (runs Tavily search)
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const li = form.querySelector('#chat-input') || form.querySelector('textarea');
        const query = (li && li.value ? li.value.trim() : '');
        if (!query) return;
        showResultScreen();
        executeTavilyQuery(query);
        // Clear the local input after sending
        if (li) li.value = '';
      });
    });
  }

  // --- Tavily API integration for search ---
  const TAVILY_API_KEY = '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'; // Replace with your actual API key

  function showResultScreen() {
    if (resultScreen) resultScreen.style.display = '';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    // hide other big screens if needed
    const hideIds = ['paper-screen','paypal-screen','contact-screen','FreePalestine','aboutscreen'];
    hideIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    // Scroll result into view
    if (resultScreen) resultScreen.scrollIntoView({behavior: 'smooth'});
  }

  async function executeTavilyQuery(q) {
    if (!q) return;

    const resultsContainer = document.getElementById('tavily-results-container');
    const queryTitle = document.getElementById('tavily-query-title');

    // Show loading state
    resultsContainer.innerHTML = '<div class="text-center text-muted"><p>Searching...</p></div>';
    queryTitle.textContent = `Results for: "${q}"`;

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: q,
          include_answer: true,
          max_results: 10
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        resultsContainer.innerHTML = '<div class="text-center text-muted"><p>No results found. Try a different search.</p></div>';
        return;
      }

      // Clear and populate results
      resultsContainer.innerHTML = '';

      // Add answer if available
      if (data.answer) {
        const answerDiv = document.createElement('div');
        answerDiv.style.cssText = 'background: rgba(97, 179, 226, 0.1); border-left: 4px solid #61b3e2; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;';
        answerDiv.innerHTML = `
          <h5 style="color: #61b3e2; margin-top: 0;">Answer</h5>
          <p style="margin: 0; color: #ccc;">${data.answer}</p>
        `;
        resultsContainer.appendChild(answerDiv);
      }

      // Add search results
      data.results.forEach((result, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = 'background: rgba(71, 70, 70, 0.5); padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(165, 163, 163, 0.2);';
        
        const title = document.createElement('h5');
        title.style.cssText = 'margin: 0 0 0.5rem 0; color: #61b3e2;';
        
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = result.title;
        link.style.cssText = 'color: #61b3e2; text-decoration: none;';
        link.addEventListener('mouseenter', () => link.style.textDecoration = 'underline');
        link.addEventListener('mouseleave', () => link.style.textDecoration = 'none');
        
        title.appendChild(link);
        resultDiv.appendChild(title);

        const snippet = document.createElement('p');
        snippet.style.cssText = 'margin: 0.5rem 0 0 0; color: #ccc; font-size: 0.95rem; line-height: 1.5;';
        snippet.textContent = result.content;
        resultDiv.appendChild(snippet);

        const urlDiv = document.createElement('div');
        urlDiv.style.cssText = 'margin-top: 0.5rem; font-size: 0.85rem; color: #999;';
        urlDiv.textContent = result.url;
        resultDiv.appendChild(urlDiv);

        resultsContainer.appendChild(resultDiv);
      });

    } catch (error) {
      console.error('Tavily API error:', error);
      resultsContainer.innerHTML = `<div class="text-center text-muted"><p>Error: ${error.message}</p><p class="small">Something went wrong with our backend.</p></div>`;
    }
  }

  // (per-form handlers were attached above)

});

