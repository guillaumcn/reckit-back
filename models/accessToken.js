var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var accessTokenSchema = mongoose.Schema({
    accessToken: String,
    expiration: Number,
    user: ObjectId
});
var AccessToken = mongoose.model('AccessToken', accessTokenSchema);

module.exports = AccessToken;