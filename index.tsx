import checkCSS, { monitorCSS } from 'checkcss';
import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App/App';

// Runtime checks for references to non-existent CSS classes (DEV only)
if (process.env.NODE_ENV == 'development') {
  checkCSS();
  monitorCSS();
}

ReactDom.render(<BrowserRouter><App/></BrowserRouter>, document.querySelector('#content'));
