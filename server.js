'use strict';

const session = require('express-session');
const express = require('express');
const http = require('http');
const uuid = require('uuid');
const bodyParser = require('body-parser');

const WebSocket = require('ws');

const app = express();
const map = new Map();
//const json_body_parser = bodyParser.json();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

//
// Serve static files from the 'public' folder.
//
app.use(express.static('public'));
app.use(sessionParser);
app.use(bodyParser.json());

app.post('/login', function(req, res) {
  //
  // "Log in" user and set userId to session.
  //
  console.log(JSON.stringify(req.body));
  const id = req.body.userName;

  console.log(`Updating session for user ${id}`);
  req.session.userId = id;
  res.send({ result: 'OK', message: `Session created/updated for ${id}`});
});

app.delete('/logout', function(req, response) {
  // identify the logout user
  console.log(JSON.stringify(req.body));
  // we will want to echo the logout username
  const oldId = req.body.userName;
  const ws = map.get(req.body.userName);

  console.log('Destroying session');
  req.session.destroy(function() {
    if (ws) ws.close();
    response.send({ result: 'OK', message: `Session destroyed for ${oldId}` });
  });
});

//
// Create HTTP server by ourselves.
//
const server = http.createServer(app);
//WebSocket.Server.clients property is only added when the clientTracking is truthy.
const wss = new WebSocket.Server({ clientTracking: true, noServer: true });

server.on('upgrade', function(req, socket, head) {
  console.log('Parsing session from req...');

  sessionParser(req, {}, () => {
    if (!req.session.userId) {
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');

    wss.handleUpgrade(req, socket, head, function(ws) {
      wss.emit('connection', ws, req);
    });
  });
});

wss.on('connection', function(ws, req) {
  const userId = req.session.userId;

  // each userId is just the userName string used as a key
  // associated with each unique websocket
  map.set(userId, ws);

  //inspect all users
  map.forEach(function(v, k) {
      console.log(k);
    }
  );

  function broadcastUserList() {
    //WebSocket.Server.clients property is only added when the clientTracking is truthy.    
    // broadcast to all clients
    wss.clients.forEach(function each(client) {
      // send a message to every connected client
      if (client.readyState === WebSocket.OPEN) {
        //client.send('Broadcast!');
        //iterate over all connected users
        let usersMessage = 'Online: ';
        map.forEach(function(v, k) {
            usersMessage += (k + ' ');
          }
        );
        client.send(usersMessage);
        console.log(Array.from(map.keys()));
        //client.send({ usernames: '[Fred, Bill]'});
      }
    });
  };

  broadcastUserList();

  ws.on('message', function(message) {
    //
    // Here we can now use session parameters.
    //
    console.log(`Received message ${message} from user ${userId}`);

    broadcastUserList();
  });

  ws.on('close', function() {
    map.delete(userId);
    broadcastUserList();
  });
});

//
// Start the server.
//
server.listen(80, function() {
  console.log('Listening on http://localhost:80');
});