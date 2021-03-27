// import another component
import React from 'react';
import ReactDom from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './components/App.js';

ReactDom.render(<Router><App/></Router>, document.querySelector('#content'));
