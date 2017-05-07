const express = require('express');

console.log('Starting up server...');

const app = express();

// Setup webpack for react
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('./webpack.config');
const compiler = webpack(config);
app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
app.use(webpackHotMiddleware(compiler));

// Serve static index page with react content
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

const port = 3000;
app.listen(port, function(){
  console.log('Server started up.\nListening on port 3000');
});

const http = require('http');
const http_server = http.createServer(app)
const io = require('socket.io')(http_server);

// Listen for socket connection on port 3001
const socket_port = 3001;
http_server.listen(socket_port, function(){
  console.log('Socket listening to 3001');
});

// Set socket.io listeners.
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // Emit current best values
  io.emit('bitcoinvalue', currentBitcoinValue);
  io.emit('currencyvalue', currentCurerncyValue);
});

let bitcoinSources = [
  {
    source: 'http://api.coindesk.com/v1/bpi/currentprice.json',
    value: null
  },
  {
    source: 'http://blockchain.info/ticker',
    value: null
  }
];

let currencySources = [
  {
    source: 'http://api.fixer.io/latest?symbols=USD',
    value: null
  },
  {
    source: 'http://rate-exchange-1.appspot.com/currency?from=EUR&to=USD',
    value: null
  }
];

const mapValue = (entry) => {return entry.value};

let currentBitcoinValue = null;
let currentCurerncyValue = null;
const calculateBest = () => {
  let bestBitcoinValue = Math.max(...bitcoinSources.map(mapValue));
  let bestCurrencyValue = Math.max(...currencySources.map(mapValue));
  if( bestBitcoinValue != currentBitcoinValue && bestBitcoinValue ) {
    currentBitcoinValue = bestBitcoinValue;
    io.emit('bitcoinvalue', currentBitcoinValue);
  }
  if( bestCurrencyValue != currentCurerncyValue && bestCurrencyValue ) {
    currentCurerncyValue = bestCurrencyValue;
    io.emit('currencyvalue', currentCurerncyValue);
  }
}

const bitcoinCallback = (request) => {
  let data = '';
  request.on('data', (chunk) => {
    data += chunk;
  });
  request.on('end', () => {
    const jsonData = JSON.parse(data);
    // Dig data from json
    if(jsonData && jsonData.bpi && jsonData.bpi.USD && !isNaN(jsonData.bpi.USD.rate_float))
    {
      bitcoinSources[0].value = jsonData.bpi.USD.rate_float * 1;
    }
    if(jsonData && jsonData.USD)
    {
      bitcoinSources[1].value = jsonData.USD.buy * 1;
    }
    calculateBest();
  });
};

const currencyCallback = (request) => {
  let data = '';
  request.on('data', (chunk) => {
    data += chunk;
  });
  request.on('end', () => {
    const jsonData = JSON.parse(data);
    // Dig data from json
    if(jsonData.rates)
    {
      currencySources[0].value = jsonData.rates.USD * 1;
    }
    if(jsonData.rate)
    {
      currencySources[1].value = jsonData.rate * 1;
    }
    calculateBest();
  });
};

const tick_interval = 1000; // ms
const update_values = () => {
  for(var i = 0; i < bitcoinSources.length; i++)
  {
    http.get(bitcoinSources[i].source, bitcoinCallback).end();
  }
  for(var i = 0; i < currencySources.length; i++)
  {
    http.get(currencySources[i].source, currencyCallback).end();
  }
}

let interval = setInterval( update_values, tick_interval );
