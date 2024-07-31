const mongoose = require('mongoose');





const Counter = mongoose.model('Counter', new mongoose.Schema({
  count: { type: Number, default: 0 }, // Start counter at 0
}));

exports.Counter = Counter;

