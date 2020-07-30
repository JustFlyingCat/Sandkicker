//setting up the ready button
const readyButton = document.getElementById('readyButton');
readyButton.onclick = function() {
    if (serverData.gamestate == 'readyWaiting') {
        sendEvent('ready');
        readyButton.disabled = true;
    }
}
//getting current username
const username = document.getElementById('currentUser').innerHTML;
//conection to the server
const socketUrl = 'ws://'+ window.location.hostname +':8080';
const socketConnection = new WebSocket(socketUrl, username);
//sending user back to the login when disconnected
socketConnection.onclose = function() {
    console.log('Closing connection');
    document.getElementById('quit').submit();
} 
//socket connection error handeling
socketConnection.onerror = err => {
    console.log(err);
}

//global variables needed in multiple funcions
let users = [];
let players = {};
let serverData = { gamestate: undefined };
let gameScore;
let game = false;

//recieving updates from the server
socketConnection.onmessage = mess => {
    //turning the recieved message into useable JSON
    const servDat = JSON.parse(mess.data);
    if (servDat.type == 'data') {
        serverData = servDat;
        //handle data updates
        //checking for changes in the user list
        if (users.length <= serverData.users.length) {
            //updates users list when new player joins
            users = serverData.users;
        } else {
            //checks if the list is still the same
            for (let i = 0; i < users.length; i++) {
                //user currently processed
                const gameUser = users[i];
                let stillPlaying = false;
                //checking if te user is still playing
                for (let k = 0; k < serverData.users.length; k++) {
                    const serverUser = serverData.users[k];
                    if (gameUser == serverUser) {
                        stillPlaying = true;
                    }
                }
                //if the user is no longer playing he will be removed
                if(!stillPlaying) {
                    users.splice(i, 1);
                    players[gameUser].sprite.destroy();
                    players[gameUser].text.destroy();
                    delete players[gameUser];
                }
            }
        }
        if (!game) {
            game = new Phaser.Game(config);
        } else {
            //updating ball data
            if(serverData.ball.position && serverData.ball.velocity && ball) {
                const dat = serverData.ball;
                ball.body.reset(dat.position[0], dat.position[1]);
                ball.body.setVelocity(dat.velocity.x, dat.velocity.y);
            }
            //updating playerdata with output from the server
            if (serverData.userdata[username].data&&player) {
                player.x = serverData.userdata[username].data[0];
                player.y = serverData.userdata[username].data[1];
            }
            //updating other players
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                if(user != username) {
                    if(serverData.userdata[user]&&players[user]) {
                        const x = serverData.userdata[user].data[0];
                        const y = serverData.userdata[user].data[1];
                        players[user].sprite.x = x;
                        players[user].sprite.y = y;
                        players[user].text.setPosition(x - players[user].text.width/2, y - 32);
                    }
                }
            }
        }
        //updating game score
        if (gameScore != serverData.score) {
            gameScore = serverData.score;
        }
    } else if(servDat.type == 'event') {
        //handle event updates
        if (servDat.event == 'goalScore') {
            announceGoal();
        } else if (servDat.event == 'matchEnd') {
            matchEnd();
        } else if (servDat.event == 'allReady') {
            setAnnouncement('starting in 3');
            setTimeout(function() {
                setAnnouncement('starting in 2')
                setTimeout(function() {
                    setAnnouncement('starting in 1');
                    setTimeout(function() {
                        setAnnouncement('!!GO!!');
                    }, 1000);
                }, 1000);
            }, 1000);
        }
    }
}

function setAnnouncement(text, reset) {
    //reset default value
    if (!reset) {
        reset = 750;
    }
    //seting announcement text
    console.log(text);
    announcementText.setText(text);
    //allignment
    announcementText.setPosition(400 - announcementText.width/2, 200)
    //text reset
    setTimeout(function() {announcementText.setText('')}, reset);
}

function matchEnd() {
    //timeout function, so the server can update the dada bevore evaluation
    setTimeout(function() {
        if(serverData.score.blue > serverData.score.red) {
            setAnnouncement('!!BLUE WINS!!', 3000);
        } else {
            setAnnouncement('!!RED WINS!!', 3000);
        }
    }, 500);
}

function announceGoal() {
    setAnnouncement('!!GOAL!!', 2000);
}

//game
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    backgroundColor: "#bfa136",
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
//global variables for the game
let player;
let score;
let playertext;
let ball;
let gamestateText;
let announcementText;

function preload() {
    this.load.image('redPlayer', 'images/red-dot.png');
    this.load.image('ball', 'images/black-dot.png');
    this.load.image('bluePlayer', 'images/blue-dot.png');
    this.load.image('goal', 'images/goalBar.png');
}

function create() {
    //enable world bounds
    this.physics.world.setBoundsCollision(true, true, true, true);
    //create an announcementText
    announcementText = this.add.text(400, 400, '', {fontSize: '32px'});
    //create gamestate text
    gamestateText = this.add.text(10, 10, 'gamestate', {fontSize: '16px'});
    //create ball
    ball = this.physics.add.image(400, 400, 'ball').setDisplaySize(16, 16).setCollideWorldBounds(true).setBounce(1, 1);
    ball.body.isCircle = true;
    ball.body.drag = new Phaser.Math.Vector2(0, 0);
    //creating player
    if (serverData.userdata[username].team == 'blue') {
        player = this.physics.add.sprite(100, 400, 'bluePlayer').setDisplaySize(32, 32).setCollideWorldBounds(true);
    } else {
        player = this.physics.add.sprite(700, 400, 'redPlayer').setDisplaySize(32, 32).setCollideWorldBounds(true);
    }
    player.body.isCircle = true;
    player.body.immovable = true;
    playertext = this.add.text(player.body.x , player.body.y, username);
    //create goals
    const redGoal = this.physics.add.sprite(20,400, 'goal').setDisplaySize(20, 80);
    redGoal.body.immovable = true;
    const blueGoal = this.physics.add.sprite(780,400, 'goal').setDisplaySize(20, 80);
    blueGoal.body.immovable = true;
    //create score
    score = this.add.text(400, 20, 'BLUE 0 || 0 RED', {fontSize: '32px'});
    score.setPosition(400 - score.width/2, 20)
    //adding colliders
    this.physics.add.collider(ball, redGoal, hitBlue, null, true);
    this.physics.add.collider(ball, blueGoal, hitRed, null, true);
    this.physics.add.collider(ball, player);
    //inputs
    //locking the mouse while playing
    this.input.on('pointerdown', function (pointer) {
        this.input.mouse.requestPointerLock();
    }, this);
    //controlling the player while in locked state
    this.input.on('pointermove', function (pointer) {
        if(serverData.gamestate == 'playing') {
            if(this.input.mouse.locked) {
                //setting the target sligthly before the player object so prevent overshooting of the mouse
                let x = player.x + 2 * pointer.movementX;
                let y = player.y + 2 * pointer.movementY;
                //calculating the overall pointer velocity so we can work with it
                let pointerVel = Math.sqrt(Math.pow(pointer.movementX, 2) + Math.pow(pointer.movementY, 2));
                //setting a maximum for the velocity
                if(pointerVel > 400) {pointerVel = 400}
                //move the player object. Needs to be done like that as collisions are not applied otherwise
                this.physics.moveTo(player, x, y, 100 + 10 * pointerVel);
            }
        }
    }, this);
    //undo lock
    this.input.keyboard.on('keydown_Q', function (event) {
        if (this.input.mouse.locked) {
            this.input.mouse.releasePointerLock();
        }
    }, this);
    this.input.keyboard.on('keydown_SPACE', function (event) {
        readyButton.click();
    }, this);
}

function hitBlue() {
    sendEvent('hitBlue');
}

function hitRed() {
    sendEvent('hitRed');
}

function sendEvent(eventCode) {
    const thisEvent = {
        from: username,
        type: 'event',
        event: eventCode
    }
    socketConnection.send(JSON.stringify(thisEvent));
}

function update() {
    score.setText('BLUE ' + gameScore.blue + ' || ' + gameScore.red + ' RED');
    //updating poition of playername
    playertext.setPosition(player.body.x - playertext.width/2 +16, player.body.y - 16);
    //creating sprites for new players
    for (let i=0; i < users.length; i++) {
        //user currently processed
        const user = users[i];
        //add gameobject if it doesnt exist already
        if (!(users[i] == username)&&!(players[user])&&serverData.userdata[user]) {
            let sprite
            if (serverData.userdata[user].team == 'blue') {
                sprite = this.physics.add.image(100, 400, 'bluePlayer').setDisplaySize(32, 32).setCollideWorldBounds(true);
            } else {
                sprite = this.physics.add.image(700, 400, 'redPlayer').setDisplaySize(32, 32).setCollideWorldBounds(true);
            }
            sprite.body.isCircle = true;
            sprite.body.immovable = true;
            const text = this.add.text(500, 500, users[i]);
            //adding collision physics
            this.physics.add.collider(ball, sprite);
            //add oameobject to list of current users
            players[user] = {sprite: sprite, text: text};
        }
        
    }
    //setting player velocity to 0 if there is no input
    player.body.velocity = new Phaser.Math.Vector2;
    //create player data to send to server
    let playerdata = {
        from: username,
        type: 'data',
        data: [player.x, player.y],
        ball: { position: [ball.x, ball.y], velocity: ball.body.velocity }
    }
    socketConnection.send(JSON.stringify(playerdata));
    //update readyButton when needed again
    if(!(serverData.gamestate == 'readyWaiting')) {
        readyButton.hidden = true;
        readyButton.disabled = false;
    } else {
        readyButton.hidden = false;
    }
    //update gamestate text field
    if (serverData.gamestate == 'playerWaiting') {
        gamestateText.setText('waiting for more players');
    } else if (serverData.gamestate == 'readyWaiting') {
        gamestateText.setText('waiting for ready up');
    } else {
        gamestateText.setText(serverData.gamestate);
    }
}