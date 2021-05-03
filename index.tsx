// import another component
import React from 'react';
import ReactDom from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter } from 'react-router-dom';

import App from './components/App';

ReactDom.render(<BrowserRouter><App/></BrowserRouter>, document.querySelector('#content'));
