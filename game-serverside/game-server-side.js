const WsWebSocket = require('ws');

exports.run = function(server) {
    //creating a WebSocket server for the game
    const wss = new WsWebSocket.Server({ port:8080, server: server, clientTracking:true });
    //testing if server is listening
    wss.on('listening', testfunction);
    function testfunction() {
        console.log('WebSockert server is running');
    }
    //testing connection with client
    wss.on('connection', function (ws, socket, client) {
        //seting binary type to arraybuffer, so i can recieve data as arrays
        ws.binaryType = 'arraybuffer';
        ws.on('message', message => {
            //turning the recived data into a useable array
            let array = new Int32Array(message);
            //sending updated data to clients
            wss.clients.forEach(function each(client) {
                if (client.readyState == WsWebSocket.OPEN) {
                    client.send(array);
                }
            })
        })
    })
}

