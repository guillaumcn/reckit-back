var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var tagSchema = mongoose.Schema({
    name: String,
    owner: ObjectId,
    public: Boolean,
    shared: [ObjectId]
});
var Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;