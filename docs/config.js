// docs/config.js

// URL for your TEXT model service (the one with Llama/Endeavor)
const TEXT_API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080' // For local testing
  : 'https://bangorinas-bangorinas-backend-text.hf.space'; // 

// URL for your VISION model service (the one with BLIP)
const VISION_API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8081' // For local testing
  : 'https://ranggafermata-bangorinas.hf.space'; // 

