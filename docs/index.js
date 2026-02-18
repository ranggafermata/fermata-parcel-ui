// This is the complete, final, and corrected index.js

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. All Variable Declarations ---
  const chatForms = document.querySelectorAll('#chat-form');
  const chatInput = document.getElementById('chat-input');
  const responseBox = document.getElementById('response-box');
  const box = responseBox;
  const yearSpan = document.getElementById('year');
  const fileInput = document.getElementById('file-input');
  const sendBtn = document.getElementById('send-btn');
  const micBtn = document.getElementById('mic-btn');
  const resultScreen = document.getElementById('result-screen');
  const welcomeScreen = document.getElementById('welcome-screen');
  const searchInput = document.getElementById('researchQuerySearch');
  const searchButton = document.getElementById('researchSubmitBtnSearch');
  const researchResultPre = document.getElementById('researchResult');
  const researchModalEl = document.getElementById('researchModal');
  const researchBtn = document.getElementById('researchBtn');

// --- Microphone Recording Variables ---
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  if (recognition) {
    recognition.lang = 'en-US';
    recognition.interimResults = true; // stream interim results to input
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // keep recognition running until we explicitly stop

    // Update the research/search input live as results arrive
    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = (res[0] && res[0].transcript) ? res[0].transcript : '';
        if (res.isFinal) finalTranscript += text;
        else interim += text;
      }
      const value = (finalTranscript || interim).trim();
      if (searchInput) searchInput.value = value;
    };

    recognition.onerror = (err) => {
      console.error('SpeechRecognition error:', err);
    };

    recognition.onend = () => {
      console.log('SpeechRecognition ended');
      // If there's a final value, trigger the search automatically
      try {
        const val = searchInput ? searchInput.value.trim() : '';
        if (val) {
          if (typeof performResearch === 'function') {
            performResearch('search', val);
          } else if (searchButton) {
            searchButton.click();
          }
        }
      } catch (e) {
        console.warn('Error on recognition end:', e);
      }
    };
  }

  // --- NEW: Microphone Button Logic (guarded if mic exists) ---
  if (micBtn) {
    micBtn.disabled = false; // ensure it's always actionable
    micBtn.addEventListener('click', async () => {
      if (isRecording) {
        // --- Stop Recording ---
        // stop recognition first so we get final transcript
        try { if (recognition) recognition.stop(); } catch (e) { console.warn(e); }
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
            if (chatForms && typeof chatForms.requestSubmit === 'function') chatForms.requestSubmit();
            // Stop recognition if still running
            try { if (recognition) recognition.stop(); } catch (e) { console.warn(e); }
            
            // Clean up the stream tracks
            stream.getTracks().forEach(track => track.stop());
          };
          
          // start the speech recognition (if available) so we stream text while recording
          try {
            if (recognition) {
              // clear previous input
              if (searchInput) searchInput.value = '';
              recognition.start();
            }
          } catch (e) {
            console.warn('Could not start recognition:', e);
          }

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

  // Research modal and related elements are declared above.

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
    const hideIds = ['paper-screen','paypal-screen','contact-screen','FreePalestine','aboutscreen'];
    hideIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    if (resultScreen) resultScreen.scrollIntoView({ behavior: 'smooth' });
  }

  // --- Tab switching ---
  const tavilyTabs = document.querySelectorAll('.tavily-tab');
  tavilyTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tavilyTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('tavily-pane-all').style.display = target === 'all' ? '' : 'none';
      document.getElementById('tavily-pane-images').style.display = target === 'images' ? '' : 'none';
    });
  });

  // --- Lightbox ---
  const lightbox = document.getElementById('tavily-lightbox');
  const lightboxImg = document.getElementById('tavily-lightbox-img');
  const lightboxClose = document.getElementById('tavily-lightbox-close');

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = 'none';
    if (lightboxImg) lightboxImg.src = '';
  }
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox && lightbox.style.display === 'flex') closeLightbox(); });

  // --- Helper: extract domain from URL ---
  function extractDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  }

  // --- Skeleton loader ---
  function showSkeletons(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skel = document.createElement('div');
      skel.className = 'tavily-result-card';
      skel.innerHTML = `
        <div class="tavily-skeleton tavily-skeleton-line" style="width:40%"></div>
        <div class="tavily-skeleton tavily-skeleton-line" style="width:70%"></div>
        <div class="tavily-skeleton tavily-skeleton-line" style="width:55%"></div>
        <div class="tavily-skeleton tavily-skeleton-block"></div>
      `;
      container.appendChild(skel);
    }
  }

  // --- Render AI Answer ---
  function renderAiAnswer(answer) {
    const box = document.getElementById('tavily-ai-answer');
    if (!box) return;
    if (!answer) { box.style.display = 'none'; return; }
    box.style.display = '';
    box.innerHTML = `
      <div class="tavily-ai-answer-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.57-3.25 3.92L12 22"/><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.57 3.25 3.92"/></svg>
        AI Answer
      </div>
      <p>${escapeHtml(answer)}</p>
    `;
  }

  // --- Escape HTML helper ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Render a single web result card ---
  function renderResultCard(result) {
    const card = document.createElement('div');
    card.className = 'tavily-result-card';

    const domain = extractDomain(result.url);
    const faviconUrl = result.favicon || `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
    const scorePercent = result.score != null ? Math.round(result.score * 100) : null;

    // Meta row (favicon + domain + score)
    const meta = document.createElement('div');
    meta.className = 'tavily-result-meta';
    const favicon = document.createElement('img');
    favicon.className = 'tavily-favicon';
    favicon.src = faviconUrl;
    favicon.alt = '';
    favicon.onerror = function () { this.style.display = 'none'; };
    meta.appendChild(favicon);

    const domainSpan = document.createElement('span');
    domainSpan.className = 'tavily-domain';
    domainSpan.textContent = domain;
    meta.appendChild(domainSpan);

    if (scorePercent !== null) {
      const badge = document.createElement('span');
      badge.className = 'tavily-score-badge';
      badge.textContent = `${scorePercent}% match`;
      meta.appendChild(badge);
    }
    card.appendChild(meta);

    // Title
    const title = document.createElement('h5');
    title.className = 'tavily-result-title';
    const link = document.createElement('a');
    link.href = result.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = result.title || domain;
    title.appendChild(link);
    card.appendChild(title);

    // Snippet
    if (result.content) {
      const snippet = document.createElement('p');
      snippet.className = 'tavily-result-snippet';
      snippet.textContent = result.content;
      card.appendChild(snippet);
    }

    return card;
  }

  // --- Render images grid ---
  function renderImagesGrid(images) {
    const grid = document.getElementById('tavily-images-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!images || images.length === 0) {
      grid.innerHTML = `
        <div class="tavily-empty" style="grid-column: 1/-1;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <p>No images found for this query.</p>
        </div>`;
      return;
    }

    images.forEach((imgUrl) => {
      const src = typeof imgUrl === 'string' ? imgUrl : imgUrl.url || '';
      if (!src) return;

      const card = document.createElement('div');
      card.className = 'tavily-img-card';

      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Search image result';
      img.loading = 'lazy';
      img.onerror = function () { card.remove(); };

      const overlay = document.createElement('div');
      overlay.className = 'tavily-img-overlay';
      const label = document.createElement('span');
      try { label.textContent = new URL(src).hostname; } catch { label.textContent = ''; }
      overlay.appendChild(label);

      card.appendChild(img);
      card.appendChild(overlay);
      card.addEventListener('click', () => openLightbox(src));

      grid.appendChild(card);
    });
  }

  // --- Main Tavily query executor ---
  async function executeTavilyQuery(q) {
    if (!q) return;

    const resultsContainer = document.getElementById('tavily-results-container');
    const queryTitle = document.getElementById('tavily-query-title');
    const resultCount = document.getElementById('tavily-result-count');
    const aiAnswer = document.getElementById('tavily-ai-answer');

    // Reset to "All" tab
    tavilyTabs.forEach(t => t.classList.remove('active'));
    const allTab = document.querySelector('.tavily-tab[data-tab="all"]');
    if (allTab) allTab.classList.add('active');
    const paneAll = document.getElementById('tavily-pane-all');
    const paneImages = document.getElementById('tavily-pane-images');
    if (paneAll) paneAll.style.display = '';
    if (paneImages) paneImages.style.display = 'none';

    queryTitle.textContent = `Results for "${q}"`;
    if (resultCount) resultCount.textContent = '';
    if (aiAnswer) aiAnswer.style.display = 'none';

    // Skeleton loading
    showSkeletons(resultsContainer, 4);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: q,
          include_answer: true,
          max_results: 10,
          include_favicon: true,
          include_images: true,
          include_image_descriptions: false
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      // Empty state
      if (!data.results || data.results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="tavily-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
            <p>No results found. Try a different search.</p>
          </div>`;
        return;
      }

      // Result count
      const webCount = data.results.length;
      const imgCount = data.images ? data.images.length : 0;
      if (resultCount) {
        resultCount.textContent = `${webCount} result${webCount !== 1 ? 's' : ''}${imgCount ? ` · ${imgCount} image${imgCount !== 1 ? 's' : ''}` : ''}`;
      }

      // AI Answer
      renderAiAnswer(data.answer || '');

      // Web results
      resultsContainer.innerHTML = '';
      data.results.forEach(r => resultsContainer.appendChild(renderResultCard(r)));

      // Images
      renderImagesGrid(data.images || []);

    } catch (error) {
      console.error('Tavily API error:', error);
      resultsContainer.innerHTML = `
        <div class="tavily-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          <p>Error: ${escapeHtml(error.message)}</p>
          <p style="font-size:0.85rem; color:#777;">Something went wrong with the search.</p>
        </div>`;
    }
  }

  // (per-form handlers were attached above)

});
