const gameConfig = {
    gameWidth: 1000,
    gameHeight: 600 
}

if (typeof window == 'undefined') {
    module.exports = { gameConfig };
}