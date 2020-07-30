const WsWebSocket = require('ws');

exports.run = function(server) {
    //gameconfig data
    const gameWidth = 1200;
    const gameHeight = 800;
    //serdata
    let serverData = { type: 'data', users: [], userdata: {}, ball: {}, score: { blue: 0, red: 0}, gamestate: 'playerWaiting' };
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
                serverData.score = { blue: 0, red: 0 };
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
            usersReady = 0;
            sendEvent('allReady')
            setTimeout(function() {
                serverData.gamestate = 'playing';
            }, 3000);
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
            serverData.gamestate = 'readyWaiting';
        } else if (blueGoalEvents > serverData.users.length/2) {
            //send red scored a goal
            resetGoalEvents();
            updateScore('red');
            sendEvent('goalScore');
            serverData.gamestate = 'readyWaiting';
        }
    }

    function keepPlayers() {
        //creating reset data
        for (let i = 0; i < serverData.users.length; i++) {
            const user = serverData.users[i];
            if(serverData.userdata[user].team == 'blue') {
                serverData.userdata[user].data = [100, gameHeight/2];
            } else {
                serverData.userdata[user].data = [gameWidth - 100, gameHeight/2];
            }
        }
        serverData.ball = { position: [gameWidth/2, gameHeight/2], velocity: {x: 0, y: 0} }
    }

    function updateScore(side) {
        if (side == 'blue') {
            serverData.score.blue += 1;
        } else if (side == 'red') {
            serverData.score.red += 1;
        }
        if (serverData.score.blue >= 6 || serverData.score.red >= 6)/*5 is just a playceholder and can be replaced by a variable later on*/ {
            //end the match if one side has won
            sendEvent('matchEnd');
            setTimeout(function() {
                serverData.score = { blue: 0, red: 0};
            }, 3000);
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
        if (redTeamMembers == blueTeamMembers && serverData.users.length != 0 && serverData.gamestate != 'playing') {
            // if there is an even number of players the ready state begins
            serverData.gamestate = 'readyWaiting';
        } else if(redTeamMembers != blueTeamMembers) {
            //if not, waiting for more players
            serverData.gamestate = 'playerWaiting';
        }
        //players cant move if the gamestate isnt 'playing'
        if (!(serverData.gamestate == 'playing')) {
            keepPlayers();
        }
        //optimising data to send
        const dataToSend = serverData;
        //processing balldata
        if(serverData.gamestate == 'playing') {
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
                            highestUser.value = value;
                        }
                    }
                }
            }
            if(highestUser.user) {
                //setting position
                dataToSend.ball.position = serverData.userdata[highestUser.user].ball.position;
                //enforcing max ball velocity
                const maxVel = 500;
                const vel = serverData.userdata[highestUser.user].ball.velocity;
                if (highestUser.value > maxVel) {
                    const ratio = maxVel/highestUser.value;
                    vel.x = vel.x * ratio;
                    vel.y = vel.y * ratio;
                }
                //setting ball velocity
                dataToSend.ball.velocity = vel;
            }
        } else {
            dataToSend.ball = serverData.ball;
        }
        //deleting unneeded data
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
            serverData = { type: 'data', users: [], userdata: {}, ball: {}, score: { blue: 0, red: 0}, gamestate: 'playerWaiting' };
        }
    }
}

