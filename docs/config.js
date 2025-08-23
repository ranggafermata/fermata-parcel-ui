// config.js

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'  // URL for local development

  : 'https://huggingface.co/spaces/ranggafermata/Bangorinas'; // URL for production
