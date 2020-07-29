exports.test = function(req, res) {
    res.render('index', {title: 'GAME'})
}

exports.playGame = function(req, res) {
    if(req.body.type == 'play') {
        console.log(req.body.username + ' wants to play');
        res.render('game', {title: 'SK', username: req.body.username});
    } else if(req.body.type == 'quit') {
        console.log(req.body.username + ' quit');
        res.redirect('/');
    } else {
        res.send('404 not found');
    }
}