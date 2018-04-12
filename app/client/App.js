import React from 'react';
import { connect } from 'react-redux';

const App = ({web3}) => (
  <div className="App">  
    <h1>Korasom</h1>
    {/* <h2>Example Truffle Dapp</h2> */}
    <h3>You have <span className="black"><span id="balance">{web3 && web3.balance}</span> KRSM</span></h3>

    <br />
    <h1>Send MetaCoin</h1>
    <br /><label htmlFor="from">From:</label><input type="text" id="from" value={web3 && web3.currentAccount} disabled></input>
    <br /><label htmlFor="amount">Amount:</label><input type="text" id="amount" placeholder="e.g., 95"></input>
    <br /><label htmlFor="receiver">To Address:</label><input type="text" id="receiver" placeholder="e.g., 0x93e66d9baea28c17d9fc393b53e3fbdd76899dae"></input>
    <br /><br /><button id="send" 
      // onClick={App.sendCoin()}
    >
      Send MetaCoin
    </button>
    <br /><br />
    <span id="status">{web3 && web3.status}</span>
    <br />
    <span className="hint"><strong>Hint:</strong> open the browser developer console to view any errors and warnings.</span>
  </div>
)

const mapStateToProps = (state) => ({ web3: state.web3 });

export default connect(mapStateToProps)(App);