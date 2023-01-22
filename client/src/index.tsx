// react 17.0.2

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import "react-grid-layout/css/styles.css";
import { AppGlobal } from 'store/AppGlobal';

ReactDOM.render(
  <React.StrictMode>
    <AppGlobal>
      <App/>
    </AppGlobal>
    
  </React.StrictMode>,
  document.getElementById('root')
);