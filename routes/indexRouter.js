const express = require('express');
const router = express.Router();

const testController = require('../controller/textController');

/* GET home page. */
router.get('/', testController.test);
//post on homepage to play the game
router.post('/', testController.playGame);

module.exports = router;