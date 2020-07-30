exports.index = function(req, res) {
    res.render('index', {title: 'SANDKICKER'})
}

exports.playGame = function(req, res) {
    if(req.body.type == 'play') {
        console.log(req.body.username + ' wants to play');
        res.render('game', {title: 'SANDKICKER', username: req.body.username});
    } else if(req.body.type == 'quit') {
        console.log(req.body.username + ' quit');
        res.redirect('/');
    } else {
        res.send('404 not found');
    }
}