const express = require('express');
const router = express.Router();

const testController = require('../controller/textController');

/* GET home page. */
router.get('/', testController.test); 

router.get('/game', testController.game);

module.exports = router;