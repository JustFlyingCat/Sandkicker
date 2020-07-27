//conection to the server
const socketUrl = 'ws://localhost:8080';
const socketConnection = new WebSocket(socketUrl);

socketConnection.onopen = () => {
    //setting connection binary type to arraybuffer, with is required for recieving array data
    socketConnection.binaryType = 'arraybuffer';
    //TODO: sending player name
}

socketConnection.onerror = err => {
    console.log(err);
}

//recieving updates from the server
//creates a typed array to send, with is required for the sending via WebSocket
let playerdata = new Int32Array(2);
socketConnection.onmessage = mess => {
    //turning the recieved arraybuffer data into a useable array
    let array = new Int32Array(mess.data);
    //change player position if different
    if(array != playerdata) {
        player.x = array[0];
        player.y = array[1];
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

    player = this.add.sprite(500, 500, 'player').setDisplaySize(32, 32);

    this.input.on('pointermove', function (pointer) {
        player.x = pointer.x;
        player.y = pointer.y;
    });
    
}

function update() {
    //updates playerdata if data has changed
    if(playerdata != [player.x, player.y]) {
        //setting data
        playerdata[0] = player.x;
        playerdata[1] = player.y;
        //send updates to the server
        socketConnection.send(playerdata);
    }
}