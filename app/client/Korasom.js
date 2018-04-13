// Import libraries we need.
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import korasom_artifacts from '../../build/contracts/KorasomGroup.json';

// Korasom is our usable abstraction, which we'll use through the code below.
var Korasom = contract(korasom_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

const generateAccountOptions = () => {
  //** Flow starts below at anon export default function */

  // Cycle through the web3 accounts 
  accounts.forEach(account => {
    const input = document.createElement("input");
    input.setAttribute('disabled', 'true');
    input.classList.add('fromaddress-option')
    input.value = account;
    document.querySelector('#fromSelect').appendChild(input)
  })
}

export default (store) => {

  window.App = {
    start: function () {
      var self = this;

      // Bootstrap the Korasom abstraction for Use.
      Korasom.setProvider(web3.currentProvider);

      // Get the initial account balance so it can be displayed.
      web3.eth.getAccounts(function (err, accs) {
        if (err != null) {
          alert("There was an error fetching your accounts.");
          return;
        }

        if (accs.length == 0) {
          alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          return;
        }

        store.dispatch({ type: 'WEB3_ALL_ACCOUNTS', accounts: accs })
        store.dispatch({ type: 'WEB3_ACTIVE_ACCOUNT', account: accs[0] })

        accounts = accs;
        account = accounts[0];

        if (accounts.length > 1) {
          generateAccountOptions()
        }

        self.refreshBalance();
      });
    },

    setStatus: function (message) {
      store.dispatch({ type: 'WEB3_STATUS', message })

      // var status = document.getElementById("status");
      // status.innerHTML = message;
    },

    refreshBalance: function () {
      var self = this;

      var meta;
      Korasom.deployed().then(function (instance) {
        meta = instance;
        return meta.balanceOf(account);
      }).then(function (value) {
        store.dispatch({ type: 'WEB3_BALANCE', balance:value.valueOf() })
        console.log('value: ',value.valueOf())
        // var balance_element = document.getElementById("balance");
        // balance_element.innerHTML = value.valueOf();
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error getting balance; see log.");
      });
    },

    sendCoin: function () {
      var self = this;

      var amount = parseInt(document.getElementById("amount").value);
      var receiver = document.getElementById("receiver").value;

      this.setStatus("Initiating transaction... (please wait)");

      var meta;
      Korasom.deployed().then(function (instance) {
        meta = instance;
        return meta.sendCoin(receiver, amount, { from: account });
      }).then(function () {
        self.setStatus("Transaction complete!");
        self.refreshBalance();
      }).catch(function (e) {
        console.log(e);
        self.setStatus("Error sending coin; see log.");
      });
    }
  };

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    App.web3Provider = web3.currentProvider;
    web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  }

  App.start();
  setInterval(()=> {
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        return;
      }

      if (accs.length == 0) {
        return;
      }
      if (account !== accs[0]){
        console.log('change detected');
        store.dispatch({ type: 'WEB3_ACTIVE_ACCOUNT', account: accs[0] })
        
        account = accs[0]
        App.refreshBalance();
      }
    })
  }, 750)
};
