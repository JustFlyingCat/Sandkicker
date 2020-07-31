const gameConfig = {
    gameWidth: 800,
    gameHeight: 200 
}

if (typeof window == 'undefined') {
    module.exports = { gameConfig };
}