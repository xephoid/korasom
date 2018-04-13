import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

import reducers, { initalState } from './reducers';
import App from './App';
import Korasom from './Korasom';

const store = createStore(reducers, initalState);

Korasom(store);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </ Provider>  
, document.querySelector('.container'))