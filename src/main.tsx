import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AgentLibrary } from './agents/AgentLibrary';
import { AgentLibraryView } from './agents/AgentLibraryView';
import './index.css';

const path = window.location.pathname.replace(/\/$/, '');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/agents' ? <AgentLibraryView /> : path === '/node-builder' ? <AgentLibrary /> : <App />}
  </StrictMode>,
);
