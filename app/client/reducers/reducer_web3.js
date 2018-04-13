export default function (state = null, action, root) {
  switch (action.type) {
    case 'WEB3_ALL_ACCOUNTS': {
      const newState = {...state};
      newState.allAccounts = action.accounts;
      return newState
    }
    case 'WEB3_ACTIVE_ACCOUNT': {
      const newState = {...state};
      newState.currentAccount = action.account;
      return newState
    }
    case 'WEB3_BALANCE': {
      const newState = { ...state };
      newState.balance = action.balance;
      return newState;
    }
    case 'WEB3_STATUS': {
      const newState = { ...state };
      newState.status = action.message;
      return newState;
    }
    default:
      return state
  }
}

// store.dispatch({ type: 'WEB3_ALL_ACCOUNTS', accounts: accs })
// store.dispatch({ type: 'WEB3_ACTIVE_ACCOUNT', account: accs[0] })