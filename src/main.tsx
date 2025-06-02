import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for debugging
window.addEventListener('error', (event) => {
  console.error('Global JS Error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
