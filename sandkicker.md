# Sandkicker

## Goal
- browsergame replicating a foosball
- gamsessions for 2-6 players at a time
- multiple sessions possible at once

## Result
- topdown football game
- gamesessions with 2 - (idk yet) players (needs an even number)
- single gamesession

## Doings/Features

### Server
- nodejs/express server
    - creates the WebSocket server for the game
    - request hadeling and html rendering
- WebSocket (game-) server
    - Processes data recieved from the clients
        - example: decides wich balldata to trust
    - manages gameloop
        - locks player and ball position if game isnt running
        - mmanages scoresystem(saves scores between rounds)
        - creates temporary gamedata for each match and resets it afterwards
    - Handeling new/loged/leaving players
    - Sends serverdata to each client multiple times a second (currently set and running at ~30Hz)
    - Sends special updates(events) when certain events happen(example: Goal, match ended, all players ready)

### Client
- html/JS
    - Name/ready/mouse sensetivity input
- WebSocket
    - Sending recieving updates
    - sending/recieving event data(example: player ready, red/blue goal hit)
- Phaser 3
    - Game rendering
    - physics calculation
    - input handeling
    - processing/applying recieved data

## Learnings

### Generell
- JSON is cool
- pure clientside calculations are kinda meh
- creating good controlls for Trackpads is pretty difficult

### tools
- Phaser 3
    - Used to calculate and render the game client-side
- WebSockets
    - ws library server-side

## Further development

### Tech/code
- Refactoring/cleaining up the code(important)
- calculating physics on the server for a better experience
    - Running Phaser 3 in Headless mode on the server(would require a nearly complete rebuild of the game)
    - useing a physics calculating library such as p2js to calculate/confirm phsyics serverside(would probably only require an extention of the server side code);
- Multiple lobbies/sessions at the time

### Game
- Setting up the config for the game yourself(maximum speeds, object sizes, amount of goals, ammount of teams, etc.)
- more gameplay elements(obstacles, power ups, portals, etc.)
- better art