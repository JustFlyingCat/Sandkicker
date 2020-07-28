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
    //console.log(serverData);
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
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }
}

let game = new Phaser.Game(config);

let player;
let ball;

function preload() {
    this.load.image('player', 'images/testImg/red-dot.png');
    this.load.image('ball', 'images/testImg/black-dot.png')
}

function create() {
    //enable world bounds
    this.physics.world.setBoundsCollision(true, true, true, true);
    //create ball
    ball = this.physics.add.image(200, 200, 'ball').setDisplaySize(16, 16).setCollideWorldBounds(true).setBounce(1, 1);
    ball.body.isCircle = true;
    ball.body.drag = new Phaser.Math.Vector2(100, 100);
    //creating player
    player = this.physics.add.sprite(800, 500, 'player').setDisplaySize(32, 32).setCollideWorldBounds(true);
    player.body.isCircle = true;
    player.body.immovable = true;
    //adding colliders
    this.physics.add.collider(ball, player);
    //inputs
    this.input.on('pointerdown', function (pointer) {
        this.input.mouse.requestPointerLock();
    }, this);
    this.input.on('pointermove', function (pointer) {
        if(this.input.mouse.locked) {
            let x = player.x + 2 * pointer.movementX;
            let y = player.y + 2 * pointer.movementY;
            player.body.moves = true;
            let pointerVel = Math.sqrt(Math.pow(pointer.movementX, 2) + Math.pow(pointer.movementY, 2));
            if(pointerVel > 400) {pointerVel = 400}
            this.physics.moveTo(player, x, y, 100 + 10 * pointerVel);
            //player.x = pointer.x;
            //player.y = pointer.y;
        }
    }, this);
    this.input.keyboard.on('keydown_Q', function (event) {
        if (this.input.mouse.locked)
        {
            this.input.mouse.releasePointerLock();
        }
    }, this);
} 

function update() {
    player.body.velocity = new Phaser.Math.Vector2;
    //creating sprites for other players
    for (let i=0; i < users.length; i++) {
        const user = users[i];
        if (!(users[i] == username)&&!(players[user])) {
            console.log('new sprite update');
            const sprite = this.add.sprite(500, 500, 'player').setDisplaySize(32, 32);
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