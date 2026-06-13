import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'sonner';
import App from './App.tsx';
import './index.css';
import { API_URL } from './lib/api';

// Intercept window.fetch globally to allow seamless split deployment (Vercel + Render/Neon)
const originalFetch = window.fetch;

function interceptFetchAndMapErrors(url: any, init: any) {
  const baseUrl = API_URL;
  if (baseUrl) {
    if (typeof url === 'string' && url.startsWith('/api')) {
      url = `${baseUrl}${url}`;
    } else if (url instanceof URL && url.pathname.startsWith('/api')) {
      url = new URL(`${baseUrl}${url.pathname}${url.search}`);
    } else if (url instanceof Request && url.url.startsWith('/api')) {
      url = new Request(`${baseUrl}${url.url}`, url);
    }
  }

  return originalFetch(url, init)
    .then(async (response) => {
      // Modify responses when status indicates error or database/network failure
      if (!response.ok) {
        const originalJson = response.json;
        const originalText = response.text;

        response.json = async function () {
          try {
            const data = await originalJson.call(this);
            if (data && typeof data === 'object') {
              const keys = ['message', 'error', 'description'];
              for (const key of keys) {
                if (data[key] && /failed to fetch|cors error|network error|econnrefused|database unavailable|socket|timeout|neon/i.test(String(data[key]))) {
                  data[key] = "Unable to connect. Please try again.";
                }
              }
            }
            return data;
          } catch (err) {
            return { message: "Unable to connect. Please try again." };
          }
        };

        response.text = async function () {
          try {
            const text = await originalText.call(this);
            if (/failed to fetch|cors error|network error|econnrefused|database unavailable|socket|timeout|neon/i.test(text)) {
              return "Unable to connect. Please try again.";
            }
            return text;
          } catch (err) {
            return "Unable to connect. Please try again.";
          }
        };
      }
      return response;
    })
    .catch((err) => {
      // Catch real offline/CORS/network Level 0 failures
      console.error('Global network error intercepted:', err);
      throw new TypeError("Unable to connect. Please try again.");
    });
}

try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: interceptFetchAndMapErrors
  });
} catch (e) {
  console.warn('Unable to directly patch window.fetch. Falling back to prototype definition...', e);
  try {
    Object.defineProperty(Window.prototype, 'fetch', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: interceptFetchAndMapErrors
    });
  } catch (err) {
    console.error('Failed to intercept window.fetch globally:', err);
  }
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
