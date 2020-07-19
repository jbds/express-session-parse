(function() {
    const messages = document.querySelector('#messages');
    //const wsOpenButton = document.querySelector('#wsOpenButton');
    const wsSendButton = document.querySelector('#wsSendButton');
    const logout = document.querySelector('#logout');
    const login = document.querySelector('#login');
    const userName = document.querySelector('#userName');
  
    function showMessage(message) {
      messages.textContent += `\n${message}`;
      messages.scrollTop = messages.scrollHeight;
    }

    function showMessageInConsole(message) {
      console.log(message);
    }
  
    function handleResponse(response) {
      return response.ok
        ? response.json().then((data) => JSON.stringify(data, null, 2))
        : Promise.reject(new Error('Unexpected response'));
    }
  
    let ws;

    function handleWsOpen() {
      if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
      }
  
      ws = new WebSocket(`ws://${location.host}`);
      ws.onerror = function() {
        showMessageInConsole('ws.onerror event fired, so WebSocket error');
      };
      ws.onopen = function() {
        showMessageInConsole('ws.onopen event fired, so WebSocket connection established');
      };
      ws.onclose = function() {
        showMessageInConsole('ws.onclose event fired, so WebSocket connection closed');
        ws = null;
      };
      // add detection of message recd from server
      ws.onmessage = function(e) {
        showMessageInConsole('ws.onmessage fired, see Websocket message received below:')
        showMessageInConsole(e.data);
      };
    };



    login.onclick = function() {
      if (!userName.value) {
        alert('Please enter your name before you log in');
        return;
      }
      fetch('/login', { 
          method: 'POST', 
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userName: userName.value }) 
      })
      .then(handleResponse)
      //.then(showMessage)
      .then(showMessageInConsole)
      // add this in JB 24/04/20
      // makes the button "Open Websocket connection" redundant
      .then(handleWsOpen)
      .catch(function(err) {
        showMessageInConsole(err.message);
      });
    };

  
    logout.onclick = function() {  
      fetch('/logout', { 
        method: 'DELETE', 
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userName: userName.value }) 
      })
      .then(handleResponse)
      .then(showMessageInConsole)
      .catch(function(err) {
        showMessageInConsole(err.message);
      });
    };
  
  
    //wsOpenButton.onclick = handleWsOpen;
  
    wsSendButton.onclick = function() {
      if (!ws) {
        showMessage('No WebSocket connection');
        alert('You must login before you can send a message');
        return;
      }
      
      let gameState = {
        pack: [1,2,3,4],
        handVisible: {north: true, east: false},
        pointOfCompassAndPlayers: [
          {pointOfCompass: "North", player: "Freddy"}
        ]
      }
      //ws.send('Hello World!');
      ws.send(JSON.stringify(gameState));
      showMessageInConsole('Sent message to server as below:');
      showMessageInConsole(JSON.stringify(gameState));
    };
  })();