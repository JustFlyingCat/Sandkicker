# SANDKICKER

## Getting startet


## Server side

### event codes CLIENT -> SERVER
- 'ready': The client has pressed the ready button

### event codes SERVER -> CLIENT
- 'allReady': indecates that all players are ready and the round will start in 3 sec
- 'goalScore': a goal has been scored
- 'matchEnd': one of the Teams has reached the maximum amount of Goals and won

### Gamestates
- 'readyWaiting': waiting for players to ready up. Switches to playing 3 sec after
- 'playerWaiting': waiting for an even ammount of players
- 'play': game is running