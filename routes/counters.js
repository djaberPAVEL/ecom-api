const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {Counter} = require('../models/counter');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();


module.exports = router;