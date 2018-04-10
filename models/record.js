var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var recordSchema = mongoose.Schema({
    name: String,
    recorder: ObjectId,
    orator: ObjectId,
    type: String,
    duration: Number,
    tags: ObjectId
});
var Record = mongoose.model('Record', recordSchema);

module.exports = Record;