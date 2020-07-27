const username = document.getElementById('currentUser').innerHTML;
console.log(username);
//conection to the server
const socketUrl = 'ws://localhost:8080';
const socketConnection = new WebSocket(socketUrl, username);

socketConnection.onclose = function() {
    console.log('Closing connection');
    document.getElementById('quit').submit();
} 

socketConnection.onerror = err => {
    console.log(err);
}

let users = [];
let players = {};
let serverData;

//recieving updates from the server
socketConnection.onmessage = mess => {
    //turning the recieved message into useable JSON
    serverData = JSON.parse(mess.data);
    console.log(serverData);
    if (users.length <= serverData.users.length) {
        users = serverData.users;
    } else {
        for (let i = 0; i < users.length; i++) {
            const gameUser = users[i];
            let stillPlaying = false;
            for (let k = 0; k < serverData.users.length; k++) {
                const serverUser = serverData.users[k];
                if (gameUser == serverUser) {
                    stillPlaying = true;
                }
            }
            if(!stillPlaying) {
                players[users[i]].destroy();
                delete players[users[i]];
                users.splice(i, 1);
            }
        }
    }
    if (serverData[username]) {
        player.x = serverData[username][0];
        player.y = serverData[username][1];
    }
    //updating other players
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if(user != username) {
            players[user].x = serverData[user][0];
            players[user].y = serverData[user][1];
        }
    }
}

//game
const config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 750,
    backgroundColor: "#4287f5",
    parent: "gameContainer",
    scene: {
        preload: preload,
        create: create,
        update: update,
    }
}

let game = new Phaser.Game(config);

let player;

function preload() {
    this.load.image('player', 'images/testImg/red-dot.png');
    this.load.image('player2', 'images/testImg/black-dot.png')
}

function create() {
    //creating controlable player
    player = this.add.sprite(500, 500, 'player').setDisplaySize(32, 32);

    this.input.on('pointermove', function (pointer) {
        player.x = Math.round(pointer.x);
        player.y = Math.round(pointer.y);
    });
    
}

function update() {
    //creating sprites for other players
    for (let i=0; i < users.length; i++) {
        const user = users[i];
        if (!(users[i] == username)&&!(players[user])) {
            console.log('new sprite update');
            const sprite = this.add.sprite(500, 500, 'player2').setDisplaySize(32, 32);
            players[user] = sprite;
        }
    }
    //create player data to send to server
    let playerdata = {
        from: username,
        data: [player.x, player.y]
    }
    socketConnection.send(JSON.stringify(playerdata));
}