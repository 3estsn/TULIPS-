import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPWAAutoUpdate } from './utils/pwaUpdate.ts';

// Register Service Worker and enable automatic updates
initPWAAutoUpdate();

createRoot(document.getElementById('root')!).render(<App />);
