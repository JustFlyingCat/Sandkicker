const express = require('express');
const router = express.Router();

const controller = require('../controller/controller');

/* GET home page. */
router.get('/', controller.index);
//post on homepage to play the game
router.post('/', controller.playGame);

module.exports = router;