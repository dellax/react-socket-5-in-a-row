"use strict"
/* eslint no-console: 0 */

const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('./webpack.config.js');

const isDeveloping = process.env.NODE_ENV !== 'production';
const port = isDeveloping ? 3000 : process.env.PORT;
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

if (isDeveloping) {
  const compiler = webpack(config);
  const middleware = webpackMiddleware(compiler, {
    publicPath: config.output.publicPath,
    contentBase: 'src',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
  app.get('*', function response(req, res) {
    res.write(middleware.fileSystem.readFileSync(path.join(__dirname, 'dist/index.html')));
    res.end();
  });
} else {
  app.use(express.static(__dirname + '/dist'));
  app.get('*', function response(req, res) {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

server.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.log(err);
  }
  console.info('==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.', port, port);
});

let board;
const users = [];
let userOnTurnIndex = 0;
let winner = false;

io.on('connection', function (socket) {
  addUser(socket);

  if (users.length === 2) {
    startGame();
  }

  socket.on('disconnect', function() {
    console.log('User' + socket.id + ' disconnected!');
    // and remove user
    let i = getUserIndex(socket.id)
    if (i > -1) users.splice(i, 1);
  });

  socket.on('game:checkCoordinates', function(coords, fn) {
    const currentUser = getUser(socket);
    
    if (currentUser.symbol === null || users.length < 2 || winner) return;
    if (board[coords.r][coords.c] === '.' && currentUser.id === users[userOnTurnIndex].id) {
      board[coords.r][coords.c] = currentUser.symbol;
      const nextUser = putNextUserOnTurn();

      if (checkWinner(board, coords)) {
        winner = true;
        nextUser.socket.emit('game:status', 'You lose');
        currentUser.socket.emit('game:status', 'You win');
      } else {
        io.emit('game:updateBoard', board);
        nextUser.socket.emit('game:status', 'Your turn');
        currentUser.socket.emit('game:status', 'Enemy turn');
      }
    } 
  });
});

function startGame() {
  users[0].symbol = 'x';
  users[1].symbol = 'o';
  userOnTurnIndex = 0;
  winner = false;
  board = createBoard(15,15);
  users[0].socket.emit('game:status', 'Your turn');
  users[1].socket.emit('game:status', 'Enemy turn');
  io.emit('game:updateBoard', board);
}

function putNextUserOnTurn() {
  if (userOnTurnIndex === 1) {
    userOnTurnIndex = 0;
  } else {
    userOnTurnIndex++;
  }
  return users[userOnTurnIndex];
}

function createBoard(rows, cols) {
  let res = [];
  for (let r = 0; r < rows; r++) {
    let row = Array.from('.'.repeat(cols));
    res.push(row);
  }
  return res;
}

function checkWinner(board, coords) {
  const sign = board[coords.r][coords.c];
  const directions = [[0, -1], [-1, 0], [-1, -1], [1, -1]];
  
  for (let direction of directions) {
    let r = coords.r; let c = coords.c;
    let len = 0;
    let dirR = direction[0]; let dirC = direction[1]; 
    
    while (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
      if (board[r][c] === sign) {
        len++;
      } else {
        break;
      }
      r += dirR; c += dirC;
    }
    
    dirR *= -1; dirC *= -1; // change direction to oposite
    r = coords.r; c = coords.c;
    while (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
      if (board[r][c] === sign) {
        len++;
      } else {
        break;
      }
      r += dirR; c += dirC;
    }
    if (len-1 === 5) return true; 
  }
  
  return false;
}

function addUser(socket) {
  users.push({
    id: socket.id,
    symbol: null,
    socket
  });
  
}

function getUser(socket) {
  const i = getUserIndex(socket.id);
  return users[i];
}

function getUserIndex(userId) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.id === userId) return i;
  }
  return -1;
}