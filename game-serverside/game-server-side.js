const WsWebSocket = require('ws');

exports.run = function(server) {
    let serverData = { users: [] };

    //creating a WebSocket server for the game
    const wss = new WsWebSocket.Server({ port:8080, server: server, clientTracking: true });
    //testing if server is listening
    wss.on('listening', testfunction);
    function testfunction() {
        console.log('WebSockert server is running');
    }
    //testing connection with client
    wss.on('connection', function (ws) {
        serverData.users.push(ws.protocol);
        //checking if username already exists in the current playerbase
        let count = 0;
        wss.clients.forEach(function each(client) {
            if (client.protocol == ws.protocol) {
                count += 1;
            }
        });
        if (count > 1) {
            //cloing connection if name already exists (rest will be handled by the clientside)
            ws.close();
        }
        //recieving messages
        ws.on('message', message => {
            //turning the recived data into a useable array
            let data = JSON.parse(message);
            serverData[data.from] = data.data;
            //TODO: save the data from all users and send them back in regular intervalls
        })
        ws.on('close', function() {
            //serch for the entry in the users list and delete them
            for (let i=0; i < serverData.users.length; i++) {
                if(serverData.users[i] == ws.protocol) {
                    delete serverData[serverData.users[i]];
                    serverData.users.splice(i, 1);
                    //end the for event
                    i = serverData.users.length + 1;
                }
            }
        })
    });
    //sending updates to the clients
    setInterval(update, 30); // server hz rate: 1000/second value|| second value: 1000/hz rate 
    //update function
    function update() {
        console.log(serverData);
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(serverData));
        });
    }
}

