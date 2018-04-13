import { combineReducers } from 'redux';
import web3Reducer from './reducer_web3';
export { default as initialState } from './initialState';

const rootReducer = combineReducers({
  web3: web3Reducer,

});

export { rootReducer as reducers };
export default rootReducer;
