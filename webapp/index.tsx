import { CheckCSS } from 'checkcss';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App/App';

// Runtime checks for references to non-existent CSS classes (DEV only)
if (process.env.NODE_ENV === 'development') {
  const checkcss = new CheckCSS();
  checkcss.scan().watch();
}

const root = createRoot(document.querySelector('#content') as Element);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
