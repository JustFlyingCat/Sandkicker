const WsWebSocket = require('ws');

exports.run = function(server) {
    let serverData = { users: [], userdata: {}, ball: {} };

    //creating a WebSocket server for the game
    const wss = new WsWebSocket.Server({ port:8080, server: server, clientTracking: true });
    //testing if server is listening
    wss.on('listening', testfunction);
    function testfunction() {
        console.log('WebSockert server is running');
    }
    //testing connection with client
    wss.on('connection', function (ws) {
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
        serverData.users.push(ws.protocol);
        //recieving messages
        ws.on('message', message => {
            //turning the recived data into a useable array
            let data = JSON.parse(message);
            serverData.userdata[data.from] = { data: data.data, ball: data.ball };
        })
        ws.on('close', function() {
            //serch for the entry in the users list and delete them
            for (let i=0; i < serverData.users.length; i++) {
                if(serverData.users[i] == ws.protocol) {
                    delete serverData.userdata[serverData.users[i]];
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
        //optimising data to send
        const dataToSend = serverData;
        //processing balldata
        let highestUser = {user: undefined, value: 0}
        for(let i = 0; i < serverData.users.length; i++) {
            const user = serverData.users[i];
            if (serverData.userdata[user]) {
                if(serverData.userdata[user].ball) {
                    const x = serverData.userdata[user].ball.velocity.x;
                    const y = serverData.userdata[user].ball.velocity.y;
                    const value = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                    if(value > highestUser.value) {
                        highestUser.user = user;
                    }
                }
            }
        }
        if(highestUser.user) {
            dataToSend.ball = serverData.userdata[highestUser.user].ball;
        }
        //deleting unneedet data
        for(let i = 0; i < dataToSend.users.length; i++) {
            const user = dataToSend.users[i];
            if (dataToSend.userdata[user]) {
                delete dataToSend.userdata[user].ball
            }
        }
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(serverData));
        });
    }
}

