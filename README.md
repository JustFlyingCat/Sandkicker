# SANDKICKER

## What is Sandkicker?
Sandkicker is a small browsergame i developed during an internship at Sandstom Media. Its a football game were teams of the same size play against each other.

## Getting startet

## Server/Client communication

### Event codes

#### event codes CLIENT -> SERVER
- 'ready': The client has pressed the ready button
- 'hitBlue': The Blue goal was hit
- 'hitRed': The Red goal was hit

#### event codes SERVER -> CLIENT
- 'allReady': indecates that all players are ready and the round will start in 3 sec
- 'goalScore': a goal has been scored
- 'matchEnd': one of the Teams has reached the maximum amount of Goals and won

### Gamestates
- 'readyWaiting': waiting for players to ready up. Switches to playing 3 sec after
- 'playerWaiting': waiting for an even ammount of players
- 'play': game is running
