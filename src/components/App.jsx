import React, { cloneElement, Component } from 'react';
const socket = require('socket.io-client').connect('http://localhost:3001/');

// Round to 2 decimal places
const round = (value) => {
  return Math.round( value * 100 ) / 100;
};

class App extends Component {
  constructor() {
    super();
    this.state = {
      currency: null,
      bitcoin: null
    }
  }
  componentWillMount() {
    const self = this;
    socket.on('connect', function(){console.log('connected');});
    // Listen on currency and bitcoin value changes
    socket.on('currencyvalue', function(payload){
      self.setState({ currency: payload * 1 });
    });
    socket.on('bitcoinvalue', function(payload){
      self.setState({ bitcoin: payload * 1 });
    });
  }
  render() {
    const {bitcoin, currency} = this.state;
    return (
      <div className="app">
        <div>USD/BTC: {bitcoin && round(bitcoin)}</div>
        <div>USD/EUR: {currency && round(currency)}</div>
        <div>EUR/BTC: {bitcoin && currency && round(bitcoin / currency)}</div>
      </div>
    );
  }
};

export default App;
