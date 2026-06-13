import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'sonner';
import App from './App.tsx';
import './index.css';

// Intercept window.fetch globally to allow seamless split deployment (Vercel + Render/Neon)
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function (input: any, init: any) {
      let url = input;
      const baseUrl = (((import.meta as any).env?.VITE_API_URL || '') as string).replace(/\/$/, ''); // strip trailing slash
      if (baseUrl) {
        if (typeof url === 'string' && url.startsWith('/api')) {
          url = `${baseUrl}${url}`;
        } else if (url instanceof URL && url.pathname.startsWith('/api')) {
          url = new URL(`${baseUrl}${url.pathname}${url.search}`);
        } else if (url instanceof Request && url.url.startsWith('/api')) {
          url = new Request(`${baseUrl}${url.url}`, url);
        }
      }
      return originalFetch(url, init);
    }
  });
} catch (e) {
  console.warn('Unable to directly patch window.fetch. Falling back to prototype definition...', e);
  try {
    Object.defineProperty(Window.prototype, 'fetch', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function (input: any, init: any) {
        let url = input;
        const baseUrl = (((import.meta as any).env?.VITE_API_URL || '') as string).replace(/\/$/, ''); // strip trailing slash
        if (baseUrl) {
          if (typeof url === 'string' && url.startsWith('/api')) {
            url = `${baseUrl}${url}`;
          } else if (url instanceof URL && url.pathname.startsWith('/api')) {
            url = new URL(`${baseUrl}${url.pathname}${url.search}`);
          } else if (url instanceof Request && url.url.startsWith('/api')) {
            url = new Request(`${baseUrl}${url.url}`, url);
          }
        }
        return originalFetch(url, init);
      }
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
