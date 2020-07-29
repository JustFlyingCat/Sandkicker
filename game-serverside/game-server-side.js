const WsWebSocket = require('ws');

exports.run = function(server) {
    //serdata
    let serverData = { type: 'data', users: [], userdata: {}, ball: {}, score: { blue: 0, red: 0}, gamestate: false };
    //creating a WebSocket server for the game
    const wss = new WsWebSocket.Server({ port:8080, server: server, clientTracking: true });
    //testing if server is listening
    wss.on('listening', testfunction);
    function testfunction() {
        console.log('WebSockert server is running');
    }
    let redTeamMembers = 0;
    let blueTeamMembers = 0;
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
        } else {
            serverData.users.push(ws.protocol);
            //assing new user to one of the teams
            let team;
            if (blueTeamMembers < redTeamMembers) {
                team = 'blue';
                blueTeamMembers += 1;
            } else {
                team = 'red';
                redTeamMembers += 1;
            }
            serverData.userdata[ws.protocol] = { team: team }
            //recieving messages
            ws.on('message', message => {
                //turning the recived data into a useable array
                let data = JSON.parse(message);
                if (data.type == 'data') {
                    //handeling data messages
                    serverData.userdata[data.from] = { data: data.data, ball: data.ball, team: serverData.userdata[data.from].team };
                } else if (data.type == 'event') {
                    //handeling event messages
                    if (data.event == 'hitBlue') {
                        blueGoalEvents += 1;
                        checkGoal();
                    } else if( data.event == 'hitRed') {
                        redGoalEvents += 1;
                        checkGoal();
                    } else if(data.event == 'ready') {
                        console.log(ws.protocol + ' is ready');
                        usersReady += 1;
                        checkAllReady();
                    }
                } else {
                    console.log('recieved unclassified data from ' + data.from);
                }
            });
            ws.on('close', function() {
                //serch for the entry in the users list and delete them
                for (let i=0; i < serverData.users.length; i++) {
                    if(serverData.users[i] == ws.protocol) {
                        //removeing from team
                        if ( serverData.userdata[serverData.users[i]].team == 'blue') {
                            blueTeamMembers -= 1;
                        } else {
                            redTeamMembers -= 1;
                        }
                        //deleting data from the left user
                        delete serverData.userdata[serverData.users[i]];
                        serverData.users.splice(i, 1);
                        //end the for event
                        i = serverData.users.length + 1;
                    }
                }
            });
        }
    });
    let usersReady = 0;
    function checkAllReady() {
        console.log(usersReady + ' out of ' + serverData.users.length + ' are Ready');
        if(usersReady == serverData.users.length) {
            serverData.gamestate = true;
            usersReady = 0;
        }
    }

    let redGoalEvents = 0;
    let blueGoalEvents = 0;

    function checkGoal() {
        if (redGoalEvents > serverData.users.length/2) {
            //send blue scored a goal
            resetGoalEvents();
            updateScore('blue');
            sendEvent('goalScore');
            serverData.gamestate = false;
        } else if (blueGoalEvents > serverData.users.length/2) {
            //send red scored a goal
            resetGoalEvents();
            updateScore('red');
            sendEvent('goalScore');
            serverData.gamestate = false;
        }
    }

    function keepPlayers() {
        //creating reset data
        for (let i = 0; i < serverData.users.length; i++) {
            const user = serverData.users[i];
            if(serverData.userdata[user].team == 'blue') {
                serverData.userdata[user].data = [100, 400];
            } else {
                serverData.userdata[user].data = [700, 400];
            }
        }
        serverData.ball = { position: [400, 400], velocity: {x: 0, y: 0} }
    }

    function updateScore(side) {
        if (side == 'blue') {
            serverData.score.blue += 1;
        } else if (side == 'red') {
            serverData.score.red += 1;
        }
        if (serverData.score.blue >= 5 || serverData.score.red >= 5)/*5 is just a playceholder and can be replaced by a variable later on*/ {
            //end the match if one side has won
            sendEvent('matchEnd');
        }
    }

    function resetGoalEvents() {
        redGoalEvents = 0;
        blueGoalEvents = 0;
    }

    function sendEvent(eventName) {
        const event = {
            type: 'event',
            event: eventName
        }
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(event));
        });
    }

    //sending updates to the clients
    setInterval(update, 30); // server hz rate: 1000/second value|| second value: 1000/hz rate 
    //update function
    function update() {
        if (!serverData.gamestate) {
            keepPlayers();
        }
        //optimising data to send
        const dataToSend = serverData;
        //processing balldata
        if(serverData.gamestate) {
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
        } else {
            dataToSend.ball = serverData.ball;
        }
        //deleting unneedet data
        for(let i = 0; i < dataToSend.users.length; i++) {
            const user = dataToSend.users[i];
            if (dataToSend.userdata[user]) {
                delete dataToSend.userdata[user].ball
            }
        }
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(dataToSend));
        });
        //reseting serverdata if all users have left
        if (serverData.users.length == 0) {
            serverData = { type: 'data', users: [], userdata: {}, ball: {}, score: { blue: 0, red: 0}, gamestate: false };
        }
    }
}

