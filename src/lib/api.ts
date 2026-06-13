// Centralized API URL resolver for OOMS Nigeria
let resolved = "";

if (typeof window !== "undefined") {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  const envApiUrl = (import.meta as any).env?.VITE_API_URL;

  // 1. VITE_API_URL environment variable has first priority if manually set
  if (envApiUrl && envApiUrl.trim() !== '') {
    resolved = envApiUrl;
  }
  // 2. Localhost detection
  else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    resolved = 'http://localhost:3050';
  }
  // 3. Google AI Studio preview detection
  else if (hostname.includes('run.app') || hostname.includes('aistudio')) {
    resolved = 'https://bhakor.onrender.com';
  }
  // 4. Vercel deployment detection
  else if (hostname.includes('vercel.app') || hostname === 'bhakor.vercel.app') {
    resolved = 'https://bhakor.onrender.com';
  }
  // 5. Cloudflare Pages detection
  else if (hostname.includes('pages.dev')) {
    resolved = 'https://bhakor.onrender.com';
  }
  // 6. Fallback
  else {
    resolved = 'https://bhakor.onrender.com';
  }
} else {
  resolved = (import.meta as any).env?.VITE_API_URL || 'https://bhakor.onrender.com';
}

// Strip any trailing slash
let normalized = resolved.replace(/\/$/, '');

// If the resolved URL ended with '/api', strip it off so that client calls using `${API_URL}/api/...`
// do not result in nested '/api/api' paths.
if (normalized.endsWith('/api')) {
  normalized = normalized.slice(0, -4);
}

export const API_URL = normalized;
