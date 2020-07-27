exports.test = function(req, res) {
    res.render('index', {title: 'GAME'})
}

exports.game = function(req, res) {
    res.render('game', {title: 'GAME'});
}