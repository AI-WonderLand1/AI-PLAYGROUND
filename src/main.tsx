import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AgentLibrary } from './agents/AgentLibrary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname.replace(/\/$/, '') === '/agents' ? <AgentLibrary /> : <App />}
  </StrictMode>,
);
