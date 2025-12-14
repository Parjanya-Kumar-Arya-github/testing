const config = {
  // Base URLs
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost/api',
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',

  // Auth Configuration
  clientId: import.meta.env.VITE_CLIENT_ID || 'portal-frontend',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/auth/callback',

  // Environment (Vite maps NODE_ENV to import.meta.env.MODE)
  env: import.meta.env.MODE, 
};

export default config;